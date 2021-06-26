const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const User = require('../../models/User')


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

        await user.save()

        const payload = {
            user: {
                id: user.id,
                role: role,
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

module.exports = router