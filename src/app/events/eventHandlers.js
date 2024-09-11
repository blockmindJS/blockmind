//const { processChatMessage } = require('../handlers/MessageHandler');
const {processChatMessage} = require("../handlers/messageHandler");


function registerEventHandlers(bot, commandsRegistry) {
    bot.on('message', async (jsonMsg, pos) => {
        await processChatMessage(bot, jsonMsg, commandsRegistry);
    });
}

module.exports = { registerEventHandlers };
