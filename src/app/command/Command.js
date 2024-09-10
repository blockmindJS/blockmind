// src/command/Command.js
const UserService = require('../../database/services/userService');

class Command {
    constructor({ name, argsCount = 0, permissions = '', allowedChatTypes = [], requirementTime = 0, cooldown = 0, variations = [], isActive = true } = {}) {
        this.name = name;
        this.argsCount = argsCount;
        this.permissions = permissions;
        this.allowedChatTypes = allowedChatTypes;
        this.requirementTime = requirementTime;
        this.cooldown = cooldown;
        this.isActive = isActive;
        this.variations = variations;
    }

    /**
     * Executes the command.
     * @param {Object} bot - The bot instance.
     * @param {string} typeChat - The type of chat (e.g., 'global', 'local').
     * @param {Object} user - The user object.
     * @param {string[]} args - The arguments passed to the command.
     */
    async execute(bot, typeChat, user, args) {
        this.user = user;

        if (args.length < this.argsCount) {
            return this.onInvalidArguments(bot, typeChat, user.username);
        }

        if (!this.allowedChatTypes.includes(typeChat)) {
            return this.onInvalidChatType(bot, typeChat, user.username);
        }

        const userHasPermissions = await this.hasPermissions();
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

    async hasPermissions() {
        return true; // Заглушка
    }

    async checkAdditionalRequirements() {
        return true; // Заглушка
    }

    onInvalidArguments(bot, typeChat, username) {
        bot.sendMessage(typeChat, `Недостаточно параметров для команды ${this.name}`, username);
    }

    onInvalidChatType(bot, typeChat, username) {
        bot.sendMessage(typeChat, `Команда ${this.name} не поддерживается в данном чате`, username);
    }

    onInsufficientPermissions(bot, typeChat, username) {
        bot.sendMessage(typeChat, `У вас нет прав для выполнения команды ${this.name}`, username);
    }

    onAdditionalRequirementsNotMet(bot, typeChat, username) {
        bot.sendMessage(typeChat, `Вы не удовлетворяете дополнительным требованиям для выполнения команды ${this.name}`, username);
    }

    onError(bot, typeChat, username, error) {
        bot.sendMessage(typeChat, `Ошибка при выполнении команды ${this.name}: ${error.message}`, username);
    }

    onCommandNotActive(bot, typeChat, username) {
        bot.sendMessage(typeChat, `Команда ${this.name} не активна`, username);
    }

    onBlacklisted(bot, typeChat, username) {
        bot.sendMessage(typeChat, `Вы заблокированы и не можете использовать команды.`, username);
    }

    /**
     * The main logic of the command, should be implemented by child classes.
     * @param {Object} bot - The bot instance.
     * @param {string} typeChat - The type of chat (e.g., 'global', 'local').
     * @param {string} username - The name of the user who issued the command.
     * @param {...string[]} args - Additional arguments for the command.
     */
    async handler(bot, typeChat, user, ...args) {
        throw new Error(`Handler not implemented for command ${this.name}`);
    }
}

module.exports = Command;
