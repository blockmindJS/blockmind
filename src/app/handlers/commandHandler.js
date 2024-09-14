// src/handlers/MessageHandler.js
const { parseArguments } = require('../utils/parseArguments');
const winston = require('winston');
const { parseMessage } = require('../utils/parse');
const Users = require("../../database/repositories/Users");

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'commands-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'commands.log' }),
    ],
});

async function processChatMessage(bot, jsonMsg) {
    const messageText = jsonMsg.toString();

    try {
        const parsedMessage = await parseMessage(bot, messageText, jsonMsg);
        if (!parsedMessage) return;

        const { type, nick, message } = parsedMessage;
        await commandHandler(bot, type, nick, message, bot.commandsRegistry);

    } catch (error) {
        console.error("Error processing message:", error);
    }
}

/**
 * Handles a command from a message.
 * @param {Object} bot - The bot instance.
 * @param {string} type - The type of chat (e.g. 'global', 'local', 'clan').
 * @param {string} nick - username of the sender
 * @param {string} message - The message text.
 */
async function commandHandler(bot, type, nick, message) {
    const COMMAND_PREFIX = bot.COMMAND_PREFIX || '@';
    if (!message.startsWith(COMMAND_PREFIX)) {
        return;
    }

    let commandName = message.split(' ')[0].substring(COMMAND_PREFIX.length);
    const args = await parseArguments(message.substring(COMMAND_PREFIX.length + commandName.length + 1));

    commandName = commandName.toLowerCase();

    const command = bot.commandsRegistry[commandName];
    if (!command) {
        console.log(`Command ${commandName} not found.`);
        return;
    }

    console.log(`Executing command: ${commandName}`);

    let user = new Users(nick);
    user = await user.init();

    await command.execute(bot, type, user, args);
}

module.exports = { processChatMessage, commandHandler };
