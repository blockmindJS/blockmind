/**
 * Class representing a message queue for bot messages.
 */
class MessageQueue {
    /**
     * Creates a new MessageQueue instance.
     * @param {Object} bot - The bot instance to send messages with.
     */
    constructor(bot) {
        this.bot = bot;
        this.queue = [];
        this.isSending = false;
        this.responseListeners = new Map();
        this.lastSendTime = Date.now();
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
            console.error('Ошибка при отправке сообщения:', error);
        } finally {
            this.isSending = false;
            if (this.queue.length > 0) {
                this.sendNextMessage();
            }
        }
    }

    /**
     * Sends a message to the specified chat type.
     * @param {string} chatType - The type of chat (e.g., 'command', 'global', 'local').
     * @param {string|string[]} messages - The message or an array of messages to send.
     * @param {string} [username] - The username (optional for private messages).
     * @param {number} delay - The delay between messages.
     * @returns {Promise<void>}
     */
    async sendMessage(chatType, messages, username, delay) {
        if (typeof messages === 'string') {
            messages = [messages];
        } else if (!Array.isArray(messages)) {
            console.error('MessageQueue: Неверный тип сообщения:', messages);
            return;
        }

        for (const message of messages) {
            console.log(`Sending message ${username} of type ${chatType}: ${message}`);

            switch (chatType) {
                case 'command':
                    await this.bot.chat(message);
                    break;
                case 'global':
                    await this.bot.chat("!" + message);
                    break;
                case 'local':
                    await this.bot.chat(message);
                    break;
                case 'private':
                    await this.bot.chat(`/msg ${username} ${message}`);
                    break;
                case 'clan':
                    await this.bot.chat(`/cc ${message}`);
                    break;
                default:
                    console.log('Неизвестный тип чата:', chatType);
                    break;
            }
            await this.delay(delay);
        }
    }

    /**
     * Adds a message to the queue for the specified chat type.
     * @param {string} chatType - The type of chat (e.g., 'command', 'global', 'local', 'private').
     * @param {string|string[]} messages - The message or an array of messages to enqueue.
     * @param {string} [username] - The username (optional for private messages).
     * @param {number} [baseDelay=4000] - The base delay between messages.
     */
    enqueueMessage(chatType, messages, username = '', baseDelay = 4000) {
        const chatDelays = {
            local: 4000,
            global: 4000,
            clan: 355,
            command: 400,
            private: 4000
        };

        const delay = chatDelays[chatType] || baseDelay;
        this.queue.push({ chatType, messages, username, delay });
        console.log(`Enqueued message: ${messages}`);

        if (!this.isSending) {
            this.sendNextMessage();
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
            console.log(`Отправляем команду: ${commandToSend}`);

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
