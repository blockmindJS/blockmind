// src/handlers/MessageHandler.js
const { parseArguments } = require('../utils/parseArguments');
const winston = require('winston');
const { parseMessage } = require('../utils/parse');
const UserService = require("../../database/services/userService");
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
    const COMMAND_PREFIX = bot.COMMAND_PREFIX || '@';

    try {
        const parsedMessage = await parseMessage(bot, messageText, jsonMsg);
        if (!parsedMessage) return;

        const { type, nick, message } = parsedMessage;

        await commandHandler(bot, type, nick, message, bot.commandsRegistry);

    } catch (error) {
        console.error("Error processing message:", error);
    }
}

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
        console.log(`Команда ${commandName} не найдена. Доступные команды: ${Object.keys(bot.commandsRegistry).join(', ')}`);
        return;
    }

    console.log(`Executing command: ${commandName}`);

    let user = new Users(nick);
    user = await user.init();

    await command.execute(bot, type, user, args);
}

module.exports = { processChatMessage, commandHandler };
