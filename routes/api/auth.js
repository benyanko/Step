const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { check, validationResult } = require('express-validator')
const config = require('config')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const user = require('../../models/User')


// @router  GET api/auth
// @desc    Test route
// @access  Public
router.get('/', auth, (async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        res.json(user)
    }
    catch (err) {
        console.log('server error')
        res.status(500).send('server error')
    }
}))

// @router  POST api/auth
// @desc    Authenticate user and get token
// @access  Public
router.post('/',
    [
        check('email', 'Please insert valid emil').isEmail(),
        check('password', 'Please insert password')
            .exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() })
        }

        let { email, password } = req.body;
        email = email.toLowerCase()

        try {
            let user = await User.findOne({ email });

            // See if user not exists
            if (!user){
                return res.status(400).json({ errors: [{msg: 'Invalid credentials'}] })
            };

            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch){
                return res.status(400).json({ errors: [{msg: 'Invalid credentials'}] })
            };

            const payload = {
                user: {
                    id: user.id,
                    role: user.role
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