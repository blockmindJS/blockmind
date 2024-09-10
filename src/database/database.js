const { getConfig } = require('../config/config');
const mongoose = require('mongoose');
const getSQLiteConnection = require('./sqlite');

let dbConnection;

/**
 * Подключение к базе данных на основе типа базы данных в конфигурации.
 * Вызывает подключение только к одной базе данных.
 */
async function connectDatabase(botOptions) {
    const config = getConfig(botOptions);

    if (config.dbType === 'sqlite') {
        dbConnection = getSQLiteConnection();
    } else if (config.dbType === 'mongodb') {
        await connectMongoDB();
    } else {
        throw new Error(`Unsupported database type: ${config.dbType}`);
    }

    return dbConnection;
}

/**
 * Подключение к MongoDB.
 */
async function connectMongoDB() {
    const config = getConfig();
    try {
        await mongoose.connect(config.mongodb.uri, config.mongodb.options);
        console.log('Подключение к MongoDB установлено.');
    } catch (err) {
        console.error('Ошибка подключения MongoDB:', err);
    }
}

module.exports = connectDatabase;
