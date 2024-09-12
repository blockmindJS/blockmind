class MessageQueue {
    /**
     * Creates a new MessageQueue instance.
     * @param {Object} bot - The bot instance to send messages with.
     * @param {Object} delayConfig - Optional configuration object for overriding delays for specific chat types.
     */
    constructor(bot, delayConfig = {}) {
        this.bot = bot;
        this.queue = [];
        this.isSending = false;
        this.responseListeners = new Map();
        this.lastSendTime = Date.now();
        this.chatTypes = {
            command: { prefix: '', delay: 400 },
            global: { prefix: '!', delay: 4000 },
            local: { prefix: '', delay: 4000 },
            private: { prefix: '/msg ', delay: 4000 },
            clan: { prefix: '/cc ', delay: 355 }
        };


        for (const chatType in delayConfig) {
            if (this.chatTypes[chatType]) {
                this.chatTypes[chatType].delay = delayConfig[chatType];
            }
        }
    }

    /**
     * Delays execution for a specified amount of milliseconds.
     * @param {number} ms - The number of milliseconds to delay.
     * @returns {Promise<void>} - A promise that resolves after the delay.
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Sends the next message in the queue, if available.
     * Ensures that messages are sent one at a time.
     * @returns {Promise<void>}
     */
    async sendNextMessage() {
        if (this.isSending || this.queue.length === 0) return;

        const { chatType, messages, username, delay } = this.queue.shift();
        this.isSending = true;

        try {
            await this.sendMessage(chatType, messages, username, delay);
        } catch (error) {
            console.error('Error when sending a message:', error);
        } finally {
            this.isSending = false;
            if (this.queue.length > 0) {
                this.sendNextMessage();
            }
        }
    }

    /**
     * Sends a message to the specified chat type.
     * @param {string} chatType - The type of chat (e.g., 'command', 'global', 'local', 'private', 'clan').
     * @param {string|string[]} messages - The message or an array of messages to send.
     * @param {string} [username] - The username (optional for private messages).
     * @param {number} delay - The delay between messages.
     * @returns {Promise<void>}
     */
    async sendMessage(chatType, messages, username, delay) {
        if (typeof messages === 'string') {
            messages = [messages];
        } else if (!Array.isArray(messages)) {
            console.error('MessageQueue: Incorrect message type:', messages);
            return;
        }

        const chatConfig = this.chatTypes[chatType];
        if (!chatConfig) {
            console.error(`Unknown chat type: ${chatType}`);
            return;
        }

        const { prefix } = chatConfig;

        for (const message of messages) {
            const fullMessage = prefix + message;
            console.log(`Sending message ${username} of type ${chatType}: ${fullMessage}`);
            await this.bot.chat(fullMessage);
            await this.delay(delay);
        }
    }

    /**
     * Adds a message to the queue for the specified chat type.
     * @param {string} chatType - The type of chat (e.g., 'command', 'global', 'local', 'private').
     * @param {string|string[]} messages - The message or an array of messages to enqueue.
     * @param {string} [username] - The username (optional for private messages).
     * @param {Object} [delayConfig] - Optional configuration object for overriding delays for specific chat types.
     */
    enqueueMessage(chatType, messages, username = '', delayConfig = {}) {
        const chatConfig = this.chatTypes[chatType];
        if (!chatConfig) {
            console.error(`Unknown chat type: ${chatType}`);
            return;
        }

        const delay = delayConfig[chatType] || chatConfig.delay;
        this.queue.push({ chatType, messages, username, delay });

        if (!this.isSending) {
            this.sendNextMessage();
        }
    }

    /**
     * Adds a new chat type.
     * @param {string} chatType - The type of chat to add.
     * @param {string} prefix - The prefix used for this chat type (e.g., '/p chat').
     * @param {number} delay - The delay for this chat type.
     */
    addType(chatType, prefix, delay) {
        this.chatTypes[chatType] = { prefix, delay };
        console.log(`Added new chat type: ${chatType} with prefix "${prefix}" and delay ${delay}ms`);
    }

    /**
     * Sets the delay for a specific chat type.
     * @param {string} chatType - The type of chat (e.g., 'local', 'global').
     * @param {number} delay - The new delay in milliseconds.
     */
    setDelay(chatType, delay) {
        if (this.chatTypes[chatType]) {
            this.chatTypes[chatType].delay = delay;
            console.log(`Delay for chat ${chatType} is set to ${delay}ms`);
        } else {
            console.error(`Chat type ${chatType} not found`);
        }
    }


    /**
     * Sends a command and waits for a matching reply from the bot's chat.
     * @param {string} commandToSend - The command to send.
     * @param {RegExp|RegExp[]} responsePatterns - The pattern(s) to match in the bot's response.
     * @param {number} timeout - The timeout duration to wait for a response in milliseconds.
     * @returns {Promise<RegExpMatchArray>} - A promise that resolves with the matching response.
     */
    sendMessageAndWaitForReply(commandToSend, responsePatterns, timeout) {
        return new Promise((resolve, reject) => {

            if (!Array.isArray(responsePatterns)) {
                responsePatterns = [responsePatterns];
            }

            const chatListener = (jsonMsg) => {
                const message = jsonMsg.toString();

                for (const pattern of responsePatterns) {
                    const match = message.match(pattern);
                    if (match) {
                        this.bot.removeListener('message', chatListener);
                        clearTimeout(timeoutId);
                        resolve(match);
                        return;
                    }
                }
            };

            this.bot.on('message', chatListener);

            const timeoutId = setTimeout(() => {
                this.bot.removeListener('message', chatListener);
                reject(new Error("Таймаут ожидания ответа"));
            }, timeout);

            this.enqueueMessage('command', commandToSend);
        });
    }
}

module.exports = MessageQueue;
