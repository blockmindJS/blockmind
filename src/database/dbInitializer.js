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


async function initializeSQLite() {

    const sequelize = require('./sqlite')();
    const Group = initializeGroupModel(sequelize);
    const Permission = initializePermissionModel(sequelize);
    const User = initializeUserModel(sequelize);

    try {
        await sequelize.sync();
        console.log('Таблицы SQLite синхронизированы.');

        await ensurePermissionExists('user.say', 'Позволяет пользователю говорить', Permission, 'sqlite');
        await ensureGroupExists('User', ['user.say'], Group, Permission, 'sqlite');
    } catch (error) {
        console.error('Ошибка при инициализации SQLite:', error);
    }
}


async function initializeMongoDB() {
    try {
        await ensurePermissionExists('user.say', 'Позволяет пользователю говорить', MongoPermission, 'mongodb');
        await ensureGroupExists('User', ['user.say'], MongoGroup, MongoPermission, 'mongodb');
        console.log('MongoDB инициализация завершена.');
    } catch (error) {
        console.error('Ошибка при инициализации MongoDB:', error);
    }
}

async function ensurePermissionExists(name, desc, PermissionModel, dbType) {
    let existingPermission;

    if (dbType === 'sqlite') {
        existingPermission = await PermissionModel.findOne({ where: { name } });
    } else if (dbType === 'mongodb') {
        existingPermission = await PermissionModel.findOne({ name }).exec();
    }

    if (!existingPermission) {
        await PermissionModel.create({ name, desc });
        console.log(`Право ${name} создано.`);
    } else {
        console.log(`Право ${name} уже существует.`);
    }
}


async function ensureGroupExists(groupName, permissions, GroupModel, PermissionModel, dbType) {
    let existingGroup;

    if (dbType === 'sqlite') {
        existingGroup = await GroupModel.findOne({ where: { name: groupName } });
    } else if (dbType === 'mongodb') {
        existingGroup = await GroupModel.findOne({ name: groupName }).populate('permissions').exec();
    }

    if (!existingGroup) {
        let newGroup;

        if (dbType === 'sqlite') {
            newGroup = await GroupModel.create({ name: groupName });

            for (const permissionName of permissions) {
                const permission = await PermissionModel.findOne({ where: { name: permissionName } });
                if (permission) {
                    await newGroup.addPermission(permission);
                    console.log(`Право ${permissionName} добавлено в группу ${groupName}.`);
                }
            }
        } else if (dbType === 'mongodb') {
            newGroup = await GroupModel.create({ name: groupName });

            for (const permissionName of permissions) {
                const permission = await PermissionModel.findOne({ name: permissionName }).exec();
                if (permission) {
                    newGroup.permissions.push(permission._id); // Добавляем _id прав для MongoDB
                    console.log(`Право ${permissionName} добавлено в группу ${groupName}.`);
                }
            }

            await newGroup.save(); // Обязательно сохраняем группу после добавления прав
            console.log(`Группа ${groupName} успешно создана с правами: ${permissions}`);
        }
    } else {
        console.log(`Группа ${groupName} уже существует.`);
    }
}





module.exports = initializeDatabase;
