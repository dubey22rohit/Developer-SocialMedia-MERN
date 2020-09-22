const express = require('express')
const router = express.Router()
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const { check, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const config = require('config')
const User = require('../../models/User')

//@route POST api/users
//@desc Register User
//@access PUBLIC

router.post('/', [
    check('name', 'Name is reuqired').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', "Please enter a password with a minimum of 6 characters").isLength({ min: 6 })
],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        try {
            const { name, email, password } = req.body
            //check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ errors: [{ message: 'User already exists' }] })
            }
            //get gravatar
            const avatar = gravatar.url(email, {
                s: "200",
                r: 'pg',
                d: 'mm'
            })
            user = new User({
                name,
                email,
                avatar,
                password
            })
            //Hash Password
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(password, salt)
            await user.save()

            //Generate Jwt
            const payload = {
                user: {
                    id: user.id
                }
            }
            jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 36000 }, (err, token) => {
                if (err) throw err
                res.json({ token })
            })
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error')
        }

    });

module.exports = router;