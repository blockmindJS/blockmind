const mongoose = require('mongoose');

const clanMemberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    joinDate: Date,
    leaveDate: Date,
    inClan: {
        type: Boolean,
        default: true
    },
    kills: Number,
    deaths: Number
});

const ClanMemberMongo = mongoose.model('ClanMember', clanMemberSchema);
module.exports = ClanMemberMongo;
