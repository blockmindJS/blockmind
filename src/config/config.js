// src/config/config.js
const path = require('path');

let currentConfig = {};

function getConfig() {
    return currentConfig;
}

function setConfig(customConfig = {}) {
    currentConfig = {
        dbType: customConfig.dbType || 'sqlite',
        customRepositories: customConfig.customRepositories || {},
        customModels: customConfig.customModels || {},
        sqlite: {
            storage: customConfig.sqlite?.storage || path.resolve(process.cwd(), './sqlite.db'),
        },
        mongodb: {
            uri: customConfig.mongodb?.uri || 'mongodb://localhost:27017/mydatabase',
            options: {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                ...customConfig.mongodb?.options,
            },
        },
    };
}

module.exports = { getConfig, setConfig };
