const { DataTypes } = require('sequelize');
let PermissionSQLite;

function initializePermissionModel(sequelize) {
    if (!PermissionSQLite) {
        PermissionSQLite = sequelize.define('Permission', {
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            desc: {
                type: DataTypes.STRING,
                allowNull: true
            }
        });
    }
    return PermissionSQLite;
}

module.exports = initializePermissionModel;
