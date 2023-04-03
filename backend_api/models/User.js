const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    surname: String,
    first_name: String,
    gender: String,
    dob: String,
    email: String,
    phone: String,
    state: String,
    city: String,
    currency_type: String,
    acct_type: String,
    username: {
        type: String,
    },
    password: {
        type: String,
        require: true
    },
    country: String,
    address: String,
    image_photo: String,
    acct_cot:  String,
    acct_imf_code: String,
    acct_pin: String,
    acct_status: {
        type: String,
        default: 'Pending',
        },
    amount: {
        type: Number,
        default: 0.0,   
    },
    acct_balance: {
        type: Number,
        default: 0.0,
    },
    // roles: [{
    //     type: String,
    //     default: "Employee"
    // }],
    active: {
        type: Boolean,
        default: true
    },
    acct_number: Number,
    last_transaction: {
        type: Number,
        default: 0.0,
    },
    user_role:{
        type: String, default: 'User'
    },
})

// export it
module.exports = mongoose.model('User', userSchema)