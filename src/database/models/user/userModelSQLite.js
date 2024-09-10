const { DataTypes } = require('sequelize');

function initializeUserModel(sequelize) {
    const User = sequelize.define('User', {
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        blacklist: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: true
        }
    });

    const Group = require('../group/groupModelSQLite')(sequelize);
    User.belongsToMany(Group, { through: 'UserGroups' });
    Group.belongsToMany(User, { through: 'UserGroups' });

    return User;
}

module.exports = initializeUserModel;
