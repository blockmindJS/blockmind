// src/database/models/clanmember/clanMemberModelSQLite.js
const sequelize = require('../../sqlite');
const { DataTypes } = require('sequelize');

const ClanMemberSQLite = sequelize.define('ClanMember', {
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    joinDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    leaveDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    inClan: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    kills: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    deaths: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

module.exports = ClanMemberSQLite;
