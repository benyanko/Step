const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    restaurantName: {
        type: String,
        required: true
    },
    restaurantDesc: {
        type: String,
        required: true
    },
    menu: [
        {
            categoryName: {
                type: String,
                required: true
            },
            categoryDesc: {
                type: String,
                required: true
            },
            dish: [
                {
                    dishName: {
                        type: String,
                        required: true
                    },
                    dishDesc: {
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
            ]
        }
    ],
});

module.exports = mongoose.model('profile', ProfileSchema);
