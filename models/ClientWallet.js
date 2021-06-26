const mongoose = require('mongoose')

const ClientWalletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    walletID: {
        type: String,
        unique: true
    },

})

module.exports = User = mongoose.model('clientWallet', ClientWalletSchema)