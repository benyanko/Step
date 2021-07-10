const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const {check, validationResult} = require('express-validator')
const axios = require('axios')

const Profile = require('../../models/Profile')
const User = require('../../models/User')

// @router  GET api/profile/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth('admin'),
    (async (req, res) => {
        try {
            const profile = await Profile.findOne({user: req.user.id})
                .populate('user', ['name', 'avatar'])

            if (!profile){
                return res.status(400).json({msg: 'There is no profile for this user'})
            }

            res.json(profile)
        }
        catch (err){
            console.error(err.message)
            res.status(500).send('Server error')
        }
}))

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
    '/',
    auth('admin'),
    check('restaurantName', 'Restaurant name is required').notEmpty(),
    check('restaurantDesc', 'Restaurant description is required').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // destructure the request
        const {
            restaurantName,
            restaurantDesc,
            // spread the rest of the fields we don't need to check
            ...rest
        } = req.body;

        // build a profile
        const profileFields = {
            user: req.user.id,
            restaurantName: restaurantName,
            restaurantDesc: restaurantDesc,
            ...rest
        };

        try {
            // Using upsert option (creates new doc if no match is found):
            let profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            return res.json(profile);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
    }
);

// @route    POST api/profile/register
// @desc     Register or worker user to profile
// @access   Private
router.post(
    '/register',
    auth('admin'),
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please insert valid emil').isEmail(),
        check('password', 'Please insert a password with 6 or more character')
            .isLength({ min: 6 })
    ], async (req, res) => {
        //TODO
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            const {name, email, password} = req.body;
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            const body = JSON.stringify({ name, email, password, role: 'worker'})

            await axios.post('http://127.0.0.1:5000/api/users', body, config)
            const worker = await User.findOne({ email: email }, '_id');
            const profile = await Profile.findOne({ user:  req.user.id } );
            profile.user.push(worker.id);
            await profile.save();
            res.status(200).json(profile)
        }catch (err){
            res.status(err.response.status).send(err.response.data)
        }
    })

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
router.get('/', (async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar'])
        res.status(200).json(profiles)
    }
    catch (err){
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
}))

// @route    GET api/profile/user/:profile_id
// @desc     Get profile by profile id
// @access   Public
router.get('/user/:profile_id', (async (req, res) => {
    try {
        const profile = await Profile.findOne({_id: req.params.profile_id})
            .populate('user', ['name', 'avatar'])

        if (!profile){
            return res.status(400).json({msg: "Profile not found"});
        }
        res.status(200).json(profile)
    }
    catch (err){
        console.error(err.message);
        if (err.kind == 'ObjectId'){
            return res.status(400).json({msg: "Profile not found"});
        }
        return res.status(500).send('Server Error');
    }
}))

// @route    GET api/profile/menu/:profile_id
// @desc     Get profile by profile id
// @access   Public
router.get('/menu/:profile_id', (async (req, res) => {
    try {
        const profile = await Profile.findOne({_id: req.params.profile_id})

        if (!profile){
            return res.status(400).json({msg: "Profile not found"});
        }
        res.status(200).json(profile.menu)
    }
    catch (err){
        console.error(err.message);
        if (err.kind == 'ObjectId'){
            return res.status(400).json({msg: "Profile not found"});
        }
        return res.status(500).send('Server Error');
    }
}))


// @route    DELETE api/profile
// @desc     Delete profile & user
// @access   Private
router.delete('/', auth('admin'), async (req, res) => {
    try {
        // Remove profile
        // Remove user
        await Promise.all([
            //Post.deleteMany({ user: req.user.id }),
            Profile.findOneAndRemove({ user: req.user.id }),
            User.findOneAndRemove({ _id: req.user.id })
        ]);

        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST api/profile/menu/category
// @desc     Add category to menu
// @access   Private
router.post(
    '/menu/category',
    auth('admin'),
    check('categoryName', 'Category name is required').notEmpty(),
    check('categoryDesc', 'Category description is required').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            profile.menu.unshift(req.body);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route    POST api/profile/menu/:category_id/dish
// @desc     Add dish to category
// @access   Private
router.post(
    '/menu/:category_id/dish',
    auth('admin'),
    check('dishName', 'Dish name is required').notEmpty(),
    check('dishDesc', 'Dish description is required').notEmpty(),
    check('dishPrice', 'Dish price is required and must be a number').notEmpty().isNumeric(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id })
            const categoryIndex = profile.menu.map(item => item.id).indexOf(req.params.category_id);
            profile.menu[categoryIndex].dish.unshift(req.body)

            await profile.save();

            return res.status(200).json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route    POST api/profile/menu/:category_id/:dish_id/change
// @desc     Add change to dish
// @access   Private
router.post(
    '/menu/:category_id/:dish_id/change',
    auth('admin'),
    check('changeName', 'Change name is required').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id })
            const categoryIndex = profile.menu.map(item => item.id).indexOf(req.params.category_id);
            const dishIndex = profile.menu[categoryIndex].dish.map(item => item.id).indexOf(req.params.dish_id);

            profile.menu[categoryIndex].dish[dishIndex].changeList.unshift(req.body)

            await profile.save();

            return res.status(200).json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route    PUT api/profile/menu/:category_id
// @desc     Edit category on menu
// @access   Private
router.put(
    '/menu/:category_id',
    auth('admin'),
    check('categoryName', 'Category name is required').notEmpty(),
    check('categoryDesc', 'Category description is required').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            const categoryIndex = profile.menu.map(item => item.id).indexOf(req.params.category_id);
            profile.menu[categoryIndex].categoryName = req.body.categoryName
            profile.menu[categoryIndex].categoryDesc = req.body.categoryDesc


            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route    PUT api/profile/menu/:category_id/:dish_id
// @desc     edit dish on category
// @access   Private
router.put(
    '/menu/:category_id/:dish_id',
    auth('admin'),
    check('dishName', 'Dish name is required').notEmpty(),
    check('dishDesc', 'Dish description is required').notEmpty(),
    check('dishPrice', 'Dish price is required and must be a number').notEmpty().isNumeric(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id })
            const categoryIndex = profile.menu.map(item => item.id).indexOf(req.params.category_id);
            const dishIndex = profile.menu[categoryIndex].dish.map(item => item.id).indexOf(req.params.dish_id);

            profile.menu[categoryIndex].dish[dishIndex].dishName = req.body.dishName
            profile.menu[categoryIndex].dish[dishIndex].dishDesc = req.body.dishDesc
            profile.menu[categoryIndex].dish[dishIndex].dishPrice = req.body.dishPrice

            await profile.save();

            return res.status(200).json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route    PUT api/profile/menu/:category_id/:dish_id/change
// @desc     Edit change on dish
// @access   Private
router.put(
    '/menu/:category_id/:dish_id/:change_id',
    auth('admin'),
    check('changeName', 'Change name is required').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id })
            const categoryIndex = profile.menu.map(item => item.id).indexOf(req.params.category_id);
            const dishIndex = profile.menu[categoryIndex].dish.map(item => item.id).indexOf(req.params.dish_id);
            const changeIndex = profile.menu[categoryIndex]
                .dish[dishIndex].changeList.map(item => item.id).indexOf(req.params.change_id);

            profile.menu[categoryIndex].dish[dishIndex].changeList[changeIndex].changeName = req.body.changeName
            if (req.body.changePrice) {
                profile.menu[categoryIndex].dish[dishIndex].changeList[changeIndex].changePrice = req.body.changePrice
            }

            await profile.save();

            return res.status(200).json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route    DELETE api/profile/menu/:category_id
// @desc     Delete category on menu
// @access   Private
router.delete(
    '/menu/:category_id',
    auth('admin'),
    async (req, res) => {
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            const categoryIndex = profile.menu.map(item => item.id).indexOf(req.params.category_id);
            profile.menu.splice(categoryIndex, 1)

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route    DELETE api/profile/menu/:category_id/:dish_id
// @desc     Delete dish on category
// @access   Private
router.delete(
    '/menu/:category_id/:dish_id',
    auth('admin'),
    async (req, res) => {
        try {
            const profile = await Profile.findOne({ user: req.user.id })
            const categoryIndex = profile.menu.map(item => item.id).indexOf(req.params.category_id);
            const dishIndex = profile.menu[categoryIndex].dish.map(item => item.id).indexOf(req.params.dish_id);

            profile.menu[categoryIndex].dish.splice(dishIndex, 1)

            await profile.save();

            return res.status(200).json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route    DELETE api/profile/menu/:category_id/:dish_id/change
// @desc     Delete change on dish
// @access   Private
router.delete(
    '/menu/:category_id/:dish_id/:change_id',
    auth('admin'),
    async (req, res) => {
        try {
            const profile = await Profile.findOne({ user: req.user.id })
            const categoryIndex = profile.menu.map(item => item.id).indexOf(req.params.category_id);
            const dishIndex = profile.menu[categoryIndex].dish.map(item => item.id).indexOf(req.params.dish_id);
            const changeIndex = profile.menu[categoryIndex]
                .dish[dishIndex].changeList.map(item => item.id).indexOf(req.params.change_id);

            profile.menu[categoryIndex].dish[dishIndex].changeList.splice(dishIndex, 1)

            await profile.save();

            return res.status(200).json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router