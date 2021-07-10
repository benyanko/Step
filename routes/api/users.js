const auth = require('../../middleware/auth')
const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const User = require('../../models/User')
const nodemailer = require('../../config/nodemailer')


// @router  POST api/users
// @desc    Register user
// @access  Public
router.post('/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please insert valid emil').isEmail(),
        check('password', 'Please insert a password with 6 or more character')
            .isLength({ min: 6 })
    ],
    async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
    }

    let { name, email, password, role } = req.body;
    email = email.toLowerCase()
    try {
        let user = await User.findOne({ email });

        // See if user exists
        if (user){
            return res.status(400).json({ errors: [{msg: 'User already exists'}] })
        };

        // Get user's gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        });

        user = new User({
            name,
            email,
            avatar,
            password,
            role,
        });

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.confirmationCode = jwt.sign({confirmationCode: "secret"},
            config.get('jwtSecret')
            )

        await user.save()
        nodemailer.sendConfirmationEmail(
            name,
            email,
            user.confirmationCode)

        return res.status(200).send('Please confirm your account')

    }
    catch (err){
        console.log(err.message)
        res.status(500).send('Server error')
    }

})

// @router  POST api/users
// @desc    Update user password
// @access  Public
router.post('/password', auth('admin', 'worker', 'user'),
    [
        check('password', 'Please insert a password with 6 or more character')
            .isLength({ min: 6 }),
        check('newPassword', 'Please insert a password with 6 or more character')
            .isLength({ min: 6 })

        ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() })
        }

        let {  password, newPassword, user } = req.body;

        try {
            let currentUser = await User.findOne({ _id: req.user.id });
            const isMatch = await bcrypt.compare(password, currentUser.password)
            if (!isMatch){
                return res.status(400).json({ errors: [{msg: 'Invalid credentials'}] })
            };



            // Encrypt password
            const salt = await bcrypt.genSalt(10);
            currentUser.password = await bcrypt.hash(newPassword, salt);

            await currentUser.save()

            const payload = {
                user: {
                    id: currentUser.id,
                    role: currentUser.role,
                }
            }
            jwt.sign(
                payload,
                config.get('jwtSecret'),
                {expiresIn: 3600},
                (err, token) => {
                    if (err) throw err
                    res.json({token} )
                });
        }
        catch (err){
            console.log(err.message)
            res.status(500).send('Server error')
        }

    })

// @router  POST api/users/recover
// @desc    Reset user password
// @access  Public
router.post('/recover',
    [
        check('email', 'Please insert valid emil').isEmail()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() })
        }

        let { email } = req.body;

        try {
            let currentUser = await User.findOne({ email: email });
            if (!currentUser){
                return res.status(400).json({ errors: [{msg: 'User not exists'}] })
            }


            currentUser.confirmationCode = jwt.sign({confirmationCode: "secret"},
                config.get('jwtSecret'))

            currentUser.resetPasswordExpires = Date.now() + 3600000

            await currentUser.save()
            nodemailer.sendResetPasswordEmail(
                currentUser.name,
                email,
                currentUser.confirmationCode)

            return res.status(200).send('Please confirm your account')
        }
        catch (err){
            console.log(err.message)
            res.status(500).send('Server error')
        }
    })

// @router  POST api/users
// @desc    Update user password
// @access  Public
router.post('/reset/:confirmationCode',
    [
        check('newPassword', 'Please insert a password with 6 or more character')
            .isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() })
        }

        let { newPassword, } = req.body;

        try {
            let currentUser = await User.findOne({
                confirmationCode: req.params.confirmationCode,
                resetPasswordExpires: {$gt: Date.now()}
            });

            // Encrypt password
            const salt = await bcrypt.genSalt(10);
            currentUser.password = await bcrypt.hash(newPassword, salt);

            currentUser.resetPasswordExpires = Date.now()

            await currentUser.save()

            res.status(200).send('password change')

        }
        catch (err){
            console.log(err.message)
            res.status(500).send('Server error')
        }

    })


module.exports = router