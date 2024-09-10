const UserRepository = require('../repositories/userRepository');
const RepositoryFactory = require('../repositories/repositoryFactory');

/**
 * @typedef {Object} UserData
 * @property {string} username
 * @property {boolean} blacklist
 */

/**
 * Сервис для работы с пользователями
 */
class UserService {
    /**
     * @param {UserRepository} userRepository
     */
    constructor(userRepository = RepositoryFactory.getRepository('user')) {
        /**
         * @private
         * @type {UserRepository}
         */
        this.userRepository = userRepository;
    }

    /**
     * Получение пользователя по имени, создаст нового, если его нет
     * @param {string} username
     * @returns {Promise<User>}
     */
    async getUserByUsername(username) {
        let user = await this.userRepository.getUserByUsername(username);

        // Если пользователь не найден или данные некорректны, бросаем исключение
        if (!user) {
            throw new Error('User not found or User model is not loaded correctly.');
        }

        return new User(user, this.userRepository);
    }
}

/**
 * Класс для работы с данными пользователя
 */
class User {
    /**
     * @param {UserData} userData
     * @param {UserRepository} userRepository
     */
    constructor(userData, userRepository) {
        // Проверяем, является ли userData экземпляром модели Sequelize (используем метод get()) или обычным объектом
        this._userData = userData && typeof userData.get === 'function' ? userData.get() : userData;
        this._userRepository = userRepository;

        // Если данные пользователя не существуют, выбрасываем ошибку
        if (!this._userData) {
            throw new Error('User data is not valid.');
        }
    }

    /**
     * Получить имя пользователя
     * @returns {string}
     */
    get username() {
        return this._userData.username;
    }

    /**
     * Получить или установить статус blacklist
     * @returns {boolean}
     */
    get blacklist() {
        return this._userData.blacklist;
    }

    /**
     * @param {boolean} value
     */
    set blacklist(value) {
        this._userData.blacklist = value;
        this._save();
    }

    /**
     * Сохранение изменений в базе данных
     * @private
     */
    async _save() {
        await this._userRepository.updateUser(this._userData);
    }
}

module.exports = UserService;
