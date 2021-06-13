const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    tableNumber: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: Boolean,
        default: false,
    },
    items: [
        {
            dishName: {
                type: String,
                required: true
            },
            dishPrice : {
                type: Number,
                required: true
            },
            changeList: [
                {
                    changeName: {
                        type: String,
                        required: true
                    },
                    changePrice: {
                        type: Number
                    }
                }
            ]
        }
    ],
    tip: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('order', OrderSchema);
