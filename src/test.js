const UserSQLite = require('./database/models/user/userModelSQLite');
const sequelize = require('./database/sqlite');

sequelize.sync().then(async () => {
    try {
        const user = await UserSQLite.create({ username: 'BigDickBot' });
        console.log('User created:', user);
    } catch (error) {
        console.error('Error creating user:', error);
    }
});
