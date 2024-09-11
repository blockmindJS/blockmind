const IUserRepository = require('../interfaces/IUserRepository');
const getModels = require('../modelInitializer');

class UserRepository extends IUserRepository {
    constructor(dbType) {
        super();
        this.dbType = dbType;
        this.models = null;
    }

    async initialize() {
        const models = await getModels();
        this.models = models;

        if (!this.models || !this.models.User) {
            throw new Error('User model is not loaded correctly.');
        } else {
            console.log('User model loaded successfully.');
        }
    }

    async createUser(userData) {
        await this.ensureModelsInitialized();

        let user;
        try {
            let groupNames = userData.groupNames || ['User'];

            let userGroups;
            if (this.dbType === 'sqlite') {
                userGroups = await this.models.Group.findAll({ where: { name: groupNames } });
                if (!userGroups || userGroups.length === 0) {
                    throw new Error('No groups found in SQLite.');
                }

                user = await this.models.User.create({ username: userData.username });

                await user.setGroups(userGroups);

                console.log(`User created in SQLite with groups: ${groupNames.join(', ')}`);
            } else if (this.dbType === 'mongodb') {
                userGroups = await this.models.Group.find({ name: { $in: groupNames } });
                if (!userGroups || userGroups.length === 0) {
                    throw new Error('No groups found in MongoDB.');
                }

                user = new this.models.User({
                    username: userData.username,
                    groups: userGroups.map(group => group._id)
                });
                await user.save();

                console.log(`User created in MongoDB with groups: ${groupNames.join(', ')}`);
            }
        } catch (error) {
            console.error(`Error creating user: ${error.message}`);
            throw error;
        }

        return user;
    }

    async getUserByUsername(username) {
        await this.ensureModelsInitialized();

        let user;
        if (this.dbType === 'sqlite') {
            user = await this.models.User.findOne({
                where: { username },
                include: [{
                    model: this.models.Group,
                    include: [{ model: this.models.Permission }]
                }]
            });
        } else if (this.dbType === 'mongodb') {
            user = await this.models.User.findOne({ username }).populate({
                path: 'groups',
                populate: { path: 'permissions' }
            });
        }

        if (user) {
            console.log(`Пользователь найден: ${JSON.stringify(user)}`);
            return user;
        }

        console.log(`Пользователь ${username} не найден, создаем нового`);
        return await this.createUser({ username });
    }






    async updateUser(userData) {
        await this.ensureModelsInitialized();

        if (this.dbType === 'sqlite') {
            const user = await this.models.User.findOne({ where: { username: userData.username } });
            if (user) {
                return await user.update(userData);
            }
        } else if (this.dbType === 'mongodb') {
            return await this.models.User.findOneAndUpdate({ username: userData.username }, userData, { new: true });
        }
    }

    async deleteUser(username) {
        await this.ensureModelsInitialized();

        if (this.dbType === 'sqlite') {
            const user = await this.models.User.findOne({ where: { username } });
            if (user) {
                return await user.destroy();
            }
        } else if (this.dbType === 'mongodb') {
            return await this.models.User.findOneAndDelete({ username });
        }
    }

    async ensureModelsInitialized() {
        if (!this.models) {
            await this.initialize();
        }
    }
}

module.exports = UserRepository;
