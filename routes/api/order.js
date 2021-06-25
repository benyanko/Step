const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const {check, validationResult} = require('express-validator')

const Profile = require('../../models/Profile')
const Order = require('../../models/Order')

// @router  GET api/order/me
// @desc    Get current user orders
// @access  Private
router.get('/me', auth('admin', 'worker'),
    (async (req, res) => {
        try {
            let rest = await Profile.findOne({user: req.user.id})
            let orders = await Order.find({restaurant: rest.id})

            if (!orders){
                return res.status(400).json({msg: 'There is no orders for this user'})
            }

            res.json(orders)
        }
        catch (err){
            console.error(err.message)
            res.status(500).send('Server error')
        }
    }))

// @route    POST api/order/:rest_id
// @desc     Create order
// @access   Private
router.post(
    '/:rest_id',
    check('tableNumber', 'Table number is required').notEmpty(),
    check('items', 'Items are required').notEmpty(),
    check('tip', 'Tip is required').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // destructure the request
        const {
            tableNumber,
            items,
            tip,
            // spread the rest of the fields we don't need to check
            ...rest
        } = req.body;

        let price = 0
        items.forEach(function(item) {
            console.log(item.dishPrice)
            price += item.dishPrice
            item.changeList.forEach(function (change){
                console.log(change.changePrice)
                price += change.changePrice
            })
        });

        const orderFields = {
            restaurant: req.params.rest_id,
            tableNumber: tableNumber,
            items: items,
            totalPrice: price,
            tip: tip
        };


        try {
            let order = Order.insertMany(orderFields)
            return res.json(order);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
    }
);

// @route    PUT api/order/:order_id
// @desc     edit order
// @access   Private
router.put(
    '/:order_id',
    auth('admin', 'worker'),
    check('tableNumber', 'Table number is required').notEmpty(),
    check('items', 'Items are required').notEmpty(),
    check('tip', 'Tip is required').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // destructure the request
        const {
            tableNumber,
            items,
            tip,
            // spread the rest of the fields we don't need to check
            ...rest
        } = req.body;

        let price = 0
        items.forEach(function(item) {
            price += item.dishPrice
            item.changeList.forEach(function (change){
                price += change.changePrice
            })
        });

        let restaurant = await Profile.findOne({user: req.user.id})

        const orderFields = {
            restaurant: restaurant.id,
            tableNumber: tableNumber,
            items: items,
            totalPrice: price,
            tip: tip
        };


        try {

            // Using upsert option (creates new doc if no match is found):
            let order = await Order.updateMany(
                {_id: req.params.order_id, restaurant: restaurant.id},
                { $set: orderFields },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );


            return res.json(order);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
    }
);


module.exports = router