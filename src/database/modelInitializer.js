const { getConfig } = require('../config/config');
const initializeUserModelSQLite = require('./models/user/userModelSQLite');
const initializePermissionModelSQLite = require('./models/permission/permissionModelSQLite');
const initializeGroupModelSQLite = require('./models/group/groupModelSQLite');
const UserMongo = require('./models/user/userModelMongo');
const PermissionMongo = require('./models/permission/permissionModelMongo');
const GroupMongo = require('./models/group/groupModelMongo');

/**
 * Initialize the models for SQLite with Sequelize.
 * @param {Sequelize} sequelize - The Sequelize instance.
 * @param {Object} customModels - Any custom models provided by the user.
 * @returns {Object} - Initialized models for SQLite.
 */
async function initializeSQLiteModels(sequelize, customModels = {}) {
    const UserSQLite = initializeUserModelSQLite(sequelize);
    const PermissionSQLite = initializePermissionModelSQLite(sequelize);
    const GroupSQLite = initializeGroupModelSQLite(sequelize);

    const initializedCustomModels = {};
    for (const [modelName, initializeCustomModel] of Object.entries(customModels)) {
        console.log(`Initializing custom model: ${modelName}`);
        initializedCustomModels[modelName] = initializeCustomModel(sequelize);
    }

    await sequelize.sync();

    return {
        User: UserSQLite,
        Permission: PermissionSQLite,
        Group: GroupSQLite,
        ...initializedCustomModels,
    };
}

/**
 * Initialize and return models based on the database type (SQLite or MongoDB).
 * @returns {Object} - Initialized models (either SQLite or MongoDB).
 */
async function getModels() {
    const config = getConfig();

    if (config.dbType === 'sqlite') {
        const sequelize = require('./sqlite')();
        return await initializeSQLiteModels(sequelize, config.customModels?.sqlite || {});
    } else if (config.dbType === 'mongodb') {
        return {
            User: UserMongo,
            Permission: PermissionMongo,
            Group: GroupMongo,
            ...config.customModels?.mongodb || {},
        };
    } else {
        throw new Error(`Unsupported database type: ${config.dbType}`);
    }
}

module.exports = getModels;
