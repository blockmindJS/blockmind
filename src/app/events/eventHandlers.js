//const { processChatMessage } = require('../handlers/MessageHandler');
const {processChatMessage} = require("../handlers/messageHandler");


function registerEventHandlers(bot, commandsRegistry) {
    bot.on('message', async (jsonMsg, pos) => {
        if (pos !== 'system') return;
        const message = jsonMsg.toString();
        await processChatMessage(bot, jsonMsg, commandsRegistry);
    });
}

module.exports = { registerEventHandlers };
