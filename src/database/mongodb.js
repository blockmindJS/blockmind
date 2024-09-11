const mongoose = require('mongoose');
const { getConfig } = require('../config/config');

const config = getConfig();

async function connectMongoDB() {
    if (config.dbType !== 'mongodb') return;

    try {
        await mongoose.connect(config.mongodb.url, config.mongodb.options);
        console.log('MongoDB подключена.');
    } catch (error) {
        console.error('Ошибка подключения MongoDB:', error);
    }
}

module.exports = connectMongoDB;
