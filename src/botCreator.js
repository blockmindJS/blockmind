// src/botCreator.js
const mineflayer = require('mineflayer');
const { getQueueInstance, initializeMessageQueue } = require("./app/queue/messageQueueSingleton");
const loadCommands = require("./app/command/commandRegistry");
const { registerEventHandlers } = require("./app/events/eventHandlers");
const initializeDatabase = require("./database/dbInitializer");
const { setConfig } = require("./config/config");
const RepositoryFactory = require('./database/repositories/repositoryFactory');
const {commandsRegistry} = require("./index");

/**
 * @typedef {import('mineflayer').Bot} MineflayerBot
 */

/**
 * Represents a bot instance with custom properties and methods, extending MineflayerBot.
 * @typedef {MineflayerBot & {
 *   COMMAND_PREFIX: string,
 *   MC_SERVER: number,
 *   sendMessage(chatType: string, message: string, username?: string, delay?: number): void,
 *   getRepository(repositoryType: string): any
 * }} BotInstance
 */

/**
 * Creates and initializes the bot.
 * @param {Object} botOptions - The bot configuration options.
 * @returns {Promise<BotInstance>} - The initialized bot instance.
 */
async function createBot(botOptions) {
    setConfig(botOptions);
    console.log(botOptions);

    const bot = /** @type {BotInstance} */ (mineflayer.createBot(botOptions));


    await initializeDatabase(botOptions);

    bot.COMMAND_PREFIX = botOptions.COMMAND_PREFIX || '@';
    bot.MC_SERVER = botOptions.MC_SERVER || 1;


    bot.getRepository = function (repositoryType) {
        return RepositoryFactory.getRepository(repositoryType);
    };

    bot.commandsRegistry = await loadCommands();


    initializeMessageQueue(bot);

    if (botOptions.host === "mc.masedworld.net" || botOptions.host === "mc.mineblaze.net" || botOptions.host === "mc.cheatmine.net") {
        registerEventHandlers(bot, commandsRegistry);
    }

    /**
     * Sends a message to the chat queue.
     * @param {string} chatType - The type of chat (e.g., 'global', 'private', 'local', 'clan'),.
     * @param {string} message - The message to send.
     * @param {string} [username=''] - The username for private messages (optional).
     * @param {number} [delay=50] - The delay between messages in milliseconds (optional).
     */
    bot.sendMessage = function (chatType, message, username = '', delay = 50) {
        getQueueInstance().enqueueMessage(chatType, message, username, delay);
    };

    return bot;
}

module.exports = { createBot };
