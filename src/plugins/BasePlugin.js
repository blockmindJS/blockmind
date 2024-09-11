class BasePlugin {
    constructor(bot) {
        this.bot = bot;
    }

    /**
     * Основной метод, который запускает плагин.
     */
    start() {
        console.log(`${this.constructor.name} plugin started`);
    }

    /**
     * Метод, который может обрабатывать сообщения или любые другие действия.
     */
    handleMessage(jsonMsg) {
        console.log(`${this.constructor.name} received message: ${jsonMsg}`);
    }

    /**
     * Метод, который может реагировать на определенные события бота.
     */
    onEvent(eventName, eventData) {
        console.log(`${this.constructor.name} handled event: ${eventName}`);
    }
}

module.exports = BasePlugin;
