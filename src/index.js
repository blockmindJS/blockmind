const { createBot } = require('./botCreator');
const Command = require('./app/command/Command');
const getModels = require('./database/modelInitializer');
const {commandHandler} = require("./app/handlers/messageHandler");

module.exports = {
    createBot,
    Command,
    getModels,
    commandHandler,
};
