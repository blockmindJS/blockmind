const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    blacklist: {
        type: Boolean,
        default: false
    },
    groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }]
});

const UserMongo = mongoose.model('User', userSchema);
module.exports = UserMongo;
