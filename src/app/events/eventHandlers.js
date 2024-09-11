//const { processChatMessage } = require('../handlers/MessageHandler');
const {processChatMessage} = require("../handlers/commandHandler");


function registerEventHandlers(bot, commandsRegistry) {
    bot.on('message', async (jsonMsg, pos) => {
        await processChatMessage(bot, jsonMsg, commandsRegistry);
    });
}

module.exports = { registerEventHandlers };
