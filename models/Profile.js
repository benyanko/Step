const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    restaurantName: {
        type: String
    },
    website: {
        type: String
    },
    location: {
        type: String
    },
    menu: [
        {
            categoryName: {
                type: String,
                required: true
            },
            description: {
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
                    changesList: [
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
