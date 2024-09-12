const MessageQueue = require('./MessageQueue');
let messageQueue = null;

function initializeMessageQueue(bot, delayConfig = {}) {
    if (!messageQueue) {
        messageQueue = new MessageQueue(bot, delayConfig);
    }
    return messageQueue;
}

function getQueueInstance() {
    if (!messageQueue) {
        throw new Error("MessageQueue не была инициализирована. Сначала вызовите initializeMessageQueue.");
    }
    return messageQueue;
}

module.exports = { initializeMessageQueue, getQueueInstance };
