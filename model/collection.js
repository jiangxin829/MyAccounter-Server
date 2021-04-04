const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    photoUrl: String,
    nickName: String,
    password: String,
    sex: {
        type: String,
        default: '未知'
    },
    birthday: {
        type: String,
        default: '未知'
    },
    identity: {
        type: String,
        default: '未知'
    },
    accounterName: {
        type: String,
        default: 'MyAccounter'
    },
    createdTime: {
        type: Date,
        default: Date.now()
    }
})

const accountSchema = new mongoose.Schema({
    accountType: String,
    accountName: String,
    accountNumber:  {
        type: String,
        default: '0.00'
    },
    accountCard:  {
        type: String,
        default: ''
    },
    createdTime: {
        type: Date,
        default: Date.now()
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

const dealSchema = new mongoose.Schema({
    dealType: String,
    dealName: String,
    dealNumber: String,
    dealTime: String,
    dealNote: String,
    dealAdvice: String,
    outAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    },
    inAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

const User = mongoose.model('User', userSchema); 
const Deal = mongoose.model('Deal', dealSchema);
const Account = mongoose.model('Account', accountSchema); 

module.exports = {User, Deal, Account};