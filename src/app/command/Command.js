const UserService = require('../../database/services/userService');

class Command {
    /**
     * @typedef {Object} CommandOptions
     * @property {string} name - Name of the command.
     * @property {number} [argsCount=0] - The number of arguments required to execute the command.
     * @property {string} [permissions=''] - Necessary rights to execute the command.
     * @property {string[]} [allowedChatTypes=[]] - Allowed chat types to execute the command.
     * @property {number} [cooldown=0] - The delay before the command is executed again (in milliseconds).
     * @property {string[]} [variations=[]] - Possible variations of the command.
     * @property {boolean} [isActive=true] - Is the command on.
     */

    /**
     * Creates an instance of the command.
     * @param {CommandOptions} options
     */
    constructor({ name, argsCount = 0, permissions = '', allowedChatTypes = [], cooldown = 0, variations = [], isActive = true } = {}) {
        /** @type {string} */
        this.name = name;

        /** @type {number} */
        this.argsCount = argsCount;

        /** @type {string} */
        this.permissions = permissions;

        /** @type {string[]} */
        this.allowedChatTypes = allowedChatTypes;

        /** @type {number} */
        this.cooldown = cooldown;

        /** @type {boolean} */
        this.isActive = isActive;

        /** @type {string[]} */
        this.variations = variations;

        /** @type {Map<string, number>} */
        this.cooldowns = new Map();


        setInterval(() => {
            const now = Date.now();
            for (const [username, lastUsed] of this.cooldowns) {
                if (now - lastUsed > this.cooldown) {
                    this.cooldowns.delete(username);
                }
            }
        }, 300000);

    }

    /**
     * Executes the command.
     * @param {Object} bot.
     * @param {string} typeChat - The type of chat (e.g. 'global', 'local', 'clan').
     * @param {Object} user
     * @param {string[]} args
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

        if (!this.isActive) {
            return this.onCommandNotActive(bot, typeChat, user.username);
        }

        const now = Date.now();

        if (this.cooldown > 0) {
            const lastUsed = this.cooldowns.get(this.user.username) || 0;
            const timePassed = now - lastUsed;

            if (timePassed < this.cooldown) {
                const timeLeft = this.cooldown - timePassed;
                return this.onCooldown(bot, typeChat, this.user.username, timeLeft);
            }
        }

        try {
            await this.handler(bot, typeChat, this.user, ...args);

            if (this.cooldown > 0) {
                this.cooldowns.set(this.user.username, now);
            }
        } catch (error) {
            this.onError(bot, typeChat, user.username, error);
        }
    }

    /**
     * Handles an error if there are insufficient arguments.
     * @param {Object} bot.
     * @param {string} typeChat - Type of chat (e.g., 'global', 'local', 'clan'').
     * @param {string} username
     */
    onInvalidArguments(bot, typeChat, username) {
        bot.sendMessage(typeChat, `Недостаточно параметров для команды ${this.name}`, username);
    }

    /**
     * Handles an error if the chat type is incorrect.
     * @param {Object} bot
     * @param {string} typeChat
     * @param {string} username
     */
    onInvalidChatType(bot, typeChat, username) {
        bot.sendMessage(typeChat, `Команда ${this.name} не поддерживается в данном чате`, username);
    }

    /**
     * Handles an error when there are insufficient permissions.
     * @param {Object} bot
     * @param {string} typeChat
     * @param {string} username
     */
    onInsufficientPermissions(bot, typeChat, username) {
        bot.sendMessage(typeChat, `У вас нет прав для выполнения команды ${this.name}`, username);
    }


    /**
     * Handles a command execution error.
     * @param {Object} bot
     * @param {string} typeChat
     * @param {string} username
     * @param {Error} error
     */
    onError(bot, typeChat, username, error) {
        bot.sendMessage(typeChat, `Ошибка при выполнении команды ${this.name}: ${error.message}`, username);
    }

    /**
     * Handling an inactive command.
     * @param {Object} bot
     * @param {string} typeChat
     * @param {string} username
     */
    onCommandNotActive(bot, typeChat, username) {
        bot.sendMessage(typeChat, `Команда ${this.name} не активна`, username);
    }

    /**
     * Handles an error when a user is locked out.
     * @param {Object} bot
     * @param {string} typeChat
     * @param {string} username
     */
    onBlacklisted(bot, typeChat, username) {
        //
    }

    /**
     * Handles when a user is on cooldown.
     * @param {Object} bot
     * @param {string} typeChat
     * @param {string} username
     * @param {number} timeLeft - Time left in milliseconds
     */
    onCooldown(bot, typeChat, username, timeLeft) {
        const seconds = Math.ceil(timeLeft / 1000);
        bot.sendMessage(typeChat, `Пожалуйста, подождите ${seconds} секунд перед использованием команды ${this.name} снова.`, username);
    }

    /**
     * Basic command logic. This method must be overridden in child classes.
     * @param {Object} bot
     * @param {string} typeChat
     * @param {Object} user
     * @param {...string[]} args
     * @throws {Error}
     */
    async handler(bot, typeChat, user, ...args) {
        throw new Error(`Handler not implemented for command ${this.name}`);
    }
}

module.exports = Command;
