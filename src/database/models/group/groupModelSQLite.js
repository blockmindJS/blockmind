const { DataTypes } = require('sequelize');
let GroupSQLite;

function initializeGroupModel(sequelize) {
    if (!GroupSQLite) {
        const Permission = require('../permission/permissionModelSQLite')(sequelize);

        GroupSQLite = sequelize.define('Group', {
            name: {
                type: DataTypes.STRING,
                allowNull: false
            }
        });

        GroupSQLite.belongsToMany(Permission, { through: 'GroupPermissions' });
        Permission.belongsToMany(GroupSQLite, { through: 'GroupPermissions' });
    }
    return GroupSQLite;
}

module.exports = initializeGroupModel;
