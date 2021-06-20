const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const {check, validationResult} = require('express-validator')

const Order = require('../../models/Order')

// @router  GET api/order/me
// @desc    Get current user orders
// @access  Private
router.get('/me', auth,
    (async (req, res) => {
        try {
            const orders = await Order.find({user: req.user.id})

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

// @route    POST api/order/:user_id
// @desc     Create or update order
// @access   Private
router.post(
    '/:user_id',
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
            user: req.params.user_id,
            tableNumber: tableNumber,
            items: items,
            totalPrice: price,
            tip: tip
        };

        try {
            // Using upsert option (creates new doc if no match is found):
            let order = await Order.findOneAndUpdate(
                { user: req.params.user_id},
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