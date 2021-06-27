const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Active'],
        default: 'Pending'
    },
    confirmationCode: {
        type: String,
        unique: true
    },
    resetPasswordExpires: {
        type: Date,
        required: false
    },
    avatar: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ['user','worker','admin'],
        default: 'user'
    },


})

module.exports = User = mongoose.model('user', UserSchema)