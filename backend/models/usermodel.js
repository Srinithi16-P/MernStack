/*
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        trim:true
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please enter your password']
    },
    phone: {
        type: String,
        required: [true, 'Please enter your phone number']
    },
    address: {
        type: String,
        required: [true, 'Please enter your address']
    },
    role: {
        type: Number,
        default: 0
    }
}, 
    { timestamps: true }

);
module.exports = mongoose.model('Users', userSchema);
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please enter your password']
    },
    phone: {
        type: String,
        required: [true, 'Please enter your phone number']
    },
    address: {
        type: String,
        required: [true, 'Please enter your address']
    },
    role: {
        type: Number,
        default: 0
    },
    

    // ─── Forgot Password Fields ───────────────────────────────────────────────
    resetPasswordToken: {
        type: String,
        default: null     // stores hashed token in DB
    },
    resetPasswordExpire: {
        type: Date,
        default: null     // token expiry time (10 minutes from request)
    }

}, { timestamps: true });

module.exports = mongoose.model('Users', userSchema);