// src/database/initializer.js
const { getConfig } = require('../config/config');
const { Sequelize } = require('sequelize');

// Default model initializers
const initializeUserModelSQLite = require('./models/user/userModelSQLite');
const initializePermissionModelSQLite = require('./models/permission/permissionModelSQLite');
const initializeGroupModelSQLite = require('./models/group/groupModelSQLite');

// Mongo models
const UserMongo = require('./models/user/userModelMongo');
const PermissionMongo = require('./models/permission/permissionModelMongo');
const GroupMongo = require('./models/group/groupModelMongo');

// Main initialization function
async function initializeModelsAndRepositories() {
    const config = getConfig();

    if (config.dbType === 'sqlite') {
        const sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: config.sqlite?.storage
        });
        const models = await initializeSQLiteModels(sequelize, config.customModels?.sqlite);
        return models;
    } else if (config.dbType === 'mongodb') {
        return {
            User: UserMongo,
            Permission: PermissionMongo,
            Group: GroupMongo,
            ...config.customModels?.mongodb || {}
        };
    } else {
        throw new Error(`Unsupported database type: ${config.dbType}`);
    }
}

// Initialize SQLite models and sync them
async function initializeSQLiteModels(sequelize, customModels = {}) {
    const models = {
        User: initializeUserModelSQLite(sequelize),
        Permission: initializePermissionModelSQLite(sequelize),
        Group: initializeGroupModelSQLite(sequelize),
        ...customModels
    };
    await sequelize.sync();
    return models;
}

module.exports = initializeModelsAndRepositories;
