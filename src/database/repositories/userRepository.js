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
        console.log('Loaded models:', models);
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
            if (this.dbType === 'sqlite') {
                user = await this.models.User.create({ username: userData.username });
                console.log(`User created in SQLite: ${JSON.stringify(user)}`);
            } else if (this.dbType === 'mongodb') {
                user = new this.models.User(userData);
                await user.save();
                console.log(`User created in MongoDB: ${JSON.stringify(user)}`);
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
            user = await this.models.User.findOne({ where: { username } });
        } else if (this.dbType === 'mongodb') {
            user = await this.models.User.findOne({ username });
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
