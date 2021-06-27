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
    '/:rest_id/:table_number',
    check('items', 'Items are required').notEmpty(),
    check('tip', 'Tip is required').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {

            let restaurant = await Profile.findOne({_id: req.params.rest_id})
            if (!restaurant){
                return res.status(400).json({ errors: [{msg: 'Restaurant not exists'}] })
            }
            // destructure the request
            const {
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
                tableNumber: req.params.table_number,
                items: items,
                totalPrice: price,
                tip: tip
            };


            let order = await Order.insertMany(orderFields)
            return res.status(200).send(orderFields);
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
    check('items', 'Items are required').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // destructure the request
        const {
            items,
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
        try {
            let restaurant = await Profile.findOne({user: req.user.id})
            let order = await Order.findOne({_id: req.params.order_id})
            if (order.restaurant != restaurant.id){
                return res.status(404).send('Order not found in this restaurant');
            }

            order.items = items
            order.totalPrice = price

            await order.save()

            return res.status(200).send(order);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
    }
);


module.exports = router