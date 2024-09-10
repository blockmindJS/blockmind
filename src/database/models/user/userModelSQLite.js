const { DataTypes } = require('sequelize');

function initializeUserModel(sequelize) {
    return sequelize.define('User', {
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        blacklist: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: true
        },
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Groups',
                key: 'id'
            }
        }
    });
}

module.exports = initializeUserModel;
