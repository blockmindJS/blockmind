const UserService = require('../../database/services/userService');

class Command {
    /**
     * @typedef {Object} CommandOptions
     * @property {string} name - Название команды.
     * @property {number} [argsCount=0] - Количество аргументов, необходимых для выполнения команды.
     * @property {string} [permissions=''] - Необходимые права для выполнения команды.
     * @property {string[]} [allowedChatTypes=[]] - Разрешённые типы чатов для выполнения команды.
     * @property {number} [requirementTime=0] - Время в миллисекундах для выполнения команды.
     * @property {number} [cooldown=0] - Задержка перед повторным выполнением команды (в миллисекундах).
     * @property {string[]} [variations=[]] - Возможные вариации команды.
     * @property {boolean} [isActive=true] - Статус активности команды.
     */

    /**
     * Создаёт экземпляр команды.
     * @param {CommandOptions} options - Настройки команды.
     */
    constructor({ name, argsCount = 0, permissions = '', allowedChatTypes = [], requirementTime = 0, cooldown = 0, variations = [], isActive = true } = {}) {
        /** @type {string} */
        this.name = name;

        /** @type {number} */
        this.argsCount = argsCount;

        /** @type {string} */
        this.permissions = permissions;

        /** @type {string[]} */
        this.allowedChatTypes = allowedChatTypes;

        /** @type {number} */
        this.requirementTime = requirementTime;

        /** @type {number} */
        this.cooldown = cooldown;

        /** @type {boolean} */
        this.isActive = isActive;

        /** @type {string[]} */
        this.variations = variations;
    }

    /**
     * Выполняет команду.
     * @param {Object} bot - Экземпляр бота.
     * @param {string} typeChat - Тип чата (например, 'global', 'local').
     * @param {Object} user - Объект пользователя.
     * @param {string[]} args - Аргументы, переданные в команду.
     * @returns {Promise<void>}
     */
    async execute(bot, typeChat, user, args) {
        this.user = user;

        if (args.length < this.argsCount) {
            return this.onInvalidArguments(bot, typeChat, user.username);
        }

        if (!this.allowedChatTypes.includes(typeChat)) {
            return this.onInvalidChatType(bot, typeChat, user.username);
        }

        const userHasPermissions = await user.hasPermission(this.permissions);
        if (!userHasPermissions) {
            return this.onInsufficientPermissions(bot, typeChat, user.username);
        }

        const userIsBlacklisted = this.user.blacklist;
        if (userIsBlacklisted) {
            return this.onBlacklisted(bot, typeChat, user.username);
        }

        if (!await this.checkAdditionalRequirements(user.username)) {
            return this.onAdditionalRequirementsNotMet(bot, typeChat, user.username);
        }

        if (!this.isActive) {
            return this.onCommandNotActive(bot, typeChat, user.username);
        }

        try {
            await this.handler(bot, typeChat, this.user, ...args);
        } catch (error) {
            this.onError(bot, typeChat, user.username, error);
        }
    }

    /**
     * Проверяет дополнительные требования для выполнения команды.
     * @returns {Promise<boolean>}
     */
    async checkAdditionalRequirements() {
        return true; // Заглушка
    }

    /**
     * Обрабатывает ошибку при недостатке аргументов.
     * @param {Object} bot - Экземпляр бота.
     * @param {string} typeChat - Тип чата.
     * @param {string} username - Имя пользователя.
     */
    onInvalidArguments(bot, typeChat, username) {
        bot.sendMessage(typeChat, `Недостаточно параметров для команды ${this.name}`, username);
    }

    /**
     * Обрабатывает ошибку при неправильном типе чата.
     * @param {Object} bot - Экземпляр бота.
     * @param {string} typeChat - Тип чата.
     * @param {string} username - Имя пользователя.
     */
    onInvalidChatType(bot, typeChat, username) {
        bot.sendMessage(typeChat, `Команда ${this.name} не поддерживается в данном чате`, username);
    }

    /**
     * Обрабатывает ошибку при недостатке прав.
     * @param {Object} bot - Экземпляр бота.
     * @param {string} typeChat - Тип чата.
     * @param {string} username - Имя пользователя.
     */
    onInsufficientPermissions(bot, typeChat, username) {
        bot.sendMessage(typeChat, `У вас нет прав для выполнения команды ${this.name}`, username);
    }

    /**
     * Обрабатывает ошибку при дополнительных требованиях.
     * @param {Object} bot - Экземпляр бота.
     * @param {string} typeChat - Тип чата.
     * @param {string} username - Имя пользователя.
     */
    onAdditionalRequirementsNotMet(bot, typeChat, username) {
        bot.sendMessage(typeChat, `Вы не удовлетворяете дополнительным требованиям для выполнения команды ${this.name}`, username);
    }

    /**
     * Обрабатывает ошибку выполнения команды.
     * @param {Object} bot - Экземпляр бота.
     * @param {string} typeChat - Тип чата.
     * @param {string} username - Имя пользователя.
     * @param {Error} error - Ошибка.
     */
    onError(bot, typeChat, username, error) {
        bot.sendMessage(typeChat, `Ошибка при выполнении команды ${this.name}: ${error.message}`, username);
    }

    /**
     * Обрабатывает отключение команды.
     * @param {Object} bot - Экземпляр бота.
     * @param {string} typeChat - Тип чата.
     * @param {string} username - Имя пользователя.
     */
    onCommandNotActive(bot, typeChat, username) {
        bot.sendMessage(typeChat, `Команда ${this.name} не активна`, username);
    }

    /**
     * Обрабатывает ошибку при блокировке пользователя.
     * @param {Object} bot - Экземпляр бота.
     * @param {string} typeChat - Тип чата.
     * @param {string} username - Имя пользователя.
     */
    onBlacklisted(bot, typeChat, username) {
        bot.sendMessage(typeChat, `Вы заблокированы и не можете использовать команды.`, username);
    }

    /**
     * Основная логика команды. Этот метод должен быть переопределён в дочерних классах.
     * @param {Object} bot - Экземпляр бота.
     * @param {string} typeChat - Тип чата.
     * @param {Object} user - Объект пользователя.
     * @param {...string[]} args - Аргументы команды.
     * @throws {Error} Если метод не переопределён.
     */
    async handler(bot, typeChat, user, ...args) {
        throw new Error(`Handler not implemented for command ${this.name}`);
    }
}

module.exports = Command;
