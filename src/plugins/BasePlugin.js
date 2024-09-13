class BasePlugin {
    /**
     * @param {BotInstance} bot - The bot instance
     * @param {Object} options - Plugin-specific options
     */
    constructor(bot, options = {}) {
        this.bot = bot;
        this.options = options;
        this.pluginName = this.constructor.name;
    }

    async start() {
        console.log(`[$${this.pluginName}] plugin started with options:`, this.options);
    }

    onEvent(eventName, eventData) {
        console.log(`${this.pluginName} handled event: ${eventName}`);
    }
}

module.exports = BasePlugin;
