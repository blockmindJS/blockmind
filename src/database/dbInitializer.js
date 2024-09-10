const mongoose = require('./mongodb');
const initializeGroupModel = require('./models/group/groupModelSQLite');
const initializePermissionModel = require('./models/permission/permissionModelSQLite');
const initializeUserModel = require('./models/user/userModelSQLite');
const MongoUser = require('./models/user/userModelMongo');
const MongoPermission = require('./models/permission/permissionModelMongo');
const MongoGroup = require('./models/group/groupModelMongo');
const connectDatabase = require('./database');
/**
 * Инициализирует базу данных в зависимости от конфигурации.
 */
async function initializeDatabase(botOptions) {
    await connectDatabase(botOptions)
    if (botOptions.dbType === 'sqlite') {
        await initializeSQLite();
    } else if (botOptions.dbType === 'mongodb') {
        await initializeMongoDB();
    } else {
        throw new Error(`Unsupported database type: ${botOptions.dbType}`);
    }
}

/**
 * Инициализация для SQLite.
 */
async function initializeSQLite() {

    const sequelize = require('./sqlite')();
    const Group = initializeGroupModel(sequelize);
    const Permission = initializePermissionModel(sequelize);
    const User = initializeUserModel(sequelize);

    try {
        await sequelize.sync();
        console.log('Таблицы SQLite синхронизированы.');

        await ensurePermissionExists('user.say', 'Позволяет пользователю говорить', Permission);
        await ensureGroupExists('User', ['user.say'], Group, Permission);
    } catch (error) {
        console.error('Ошибка при инициализации SQLite:', error);
    }
}

/**
 * Инициализация для MongoDB.
 */
async function initializeMongoDB() {
    try {
        await ensurePermissionExists('user.say', 'Позволяет пользователю говорить', MongoPermission);
        await ensureGroupExists('User', ['user.say'], MongoGroup, MongoPermission);
        console.log('MongoDB инициализация завершена.');
    } catch (error) {
        console.error('Ошибка при инициализации MongoDB:', error);
    }
}

/**
 * Проверяет и создает право, если его нет.
 * @param {string} name - Название права.
 * @param {string} desc - Описание права.
 * @param {Object} PermissionModel - Модель прав (для SQLite или MongoDB).
 */
async function ensurePermissionExists(name, desc, PermissionModel) {
    const existingPermission = await PermissionModel.findOne({ where: { name } });
    if (!existingPermission) {
        await PermissionModel.create({ name, desc });
        console.log(`Право ${name} создано.`);
    } else {
        console.log(`Право ${name} уже существует.`);
    }
}

/**
 * Проверяет и создает группу, если её нет.
 * @param {string} groupName - Название группы.
 * @param {string[]} permissions - Права, которые нужно добавить в группу.
 * @param {Object} GroupModel - Модель группы (для SQLite или MongoDB).
 * @param {Object} PermissionModel - Модель прав (для SQLite или MongoDB).
 */
async function ensureGroupExists(groupName, permissions, GroupModel, PermissionModel) {
    const existingGroup = await GroupModel.findOne({ where: { name: groupName } });
    if (!existingGroup) {
        const newGroup = await GroupModel.create({ name: groupName });
        console.log(`Группа ${groupName} создана.`);

        for (const permissionName of permissions) {
            const permission = await PermissionModel.findOne({ where: { name: permissionName } });
            if (permission) {
                await newGroup.addPermission(permission);
                console.log(`Право ${permissionName} добавлено в группу ${groupName}.`);
            }
        }
    } else {
        console.log(`Группа ${groupName} уже существует.`);
    }
}

module.exports = initializeDatabase;
