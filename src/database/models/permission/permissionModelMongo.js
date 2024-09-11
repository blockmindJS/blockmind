const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    desc: String
});

const PermissionMongo = mongoose.model('Permission', permissionSchema);
module.exports = PermissionMongo;
