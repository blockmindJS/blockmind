const { Sequelize } = require('sequelize');
const path = require('path');
const { getConfig } = require('../config/config');

let sequelizeInstance = null;

/**
 * Функция для получения или создания подключения к SQLite.
 * Соединение создается только при первом вызове.
 */
function getSQLiteConnection() {
    if (!sequelizeInstance) {
        const config = getConfig();

        sequelizeInstance = new Sequelize({
            dialect: 'sqlite',
            storage: config.sqlite?.storage || path.resolve(process.cwd(), './sqlite.db'),
            logging: console.log,
        });

        sequelizeInstance.authenticate()
            .then(() => console.log('Соединение с SQLite установлено.'))
            .catch(err => console.error('Не удалось подключиться к SQLite:', err));
    }

    return sequelizeInstance;
}

module.exports = getSQLiteConnection;
