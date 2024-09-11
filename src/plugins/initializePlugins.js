const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

/**
 * Загрузка плагина с GitHub
 * @param {string} repoUrl - URL репозитория GitHub
 * @param {string} localPath - Локальный путь для сохранения плагина
 * @returns {Promise<Function>} - Возвращает класс плагина
 */
async function loadPluginFromGithub(repoUrl, localPath) {
    const pluginDir = path.resolve(__dirname, localPath);

    // Клонирование репозитория, если он не существует
    if (!fs.existsSync(pluginDir)) {
        await new Promise((resolve, reject) => {
            exec(`git clone ${repoUrl} ${pluginDir}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error cloning repository: ${stderr}`);
                    reject(error);
                } else {
                    console.log(`Cloned plugin from ${repoUrl}`);
                    resolve();
                }
            });
        });
    }

    // Возвращаем загруженный плагин
    return require(path.join(pluginDir, 'index.js'));
}

/**
 * Инициализация плагинов
 * @param {Object} bot - Инстанс бота
 * @param {Array<Object>} plugins - Список конфигураций плагинов
 */
async function initializePlugins(bot, plugins) {
    const loadedPlugins = [];

    for (const pluginConfig of plugins) {
        let PluginClass;

        if (pluginConfig.type === 'local') {
            PluginClass = require(path.resolve(process.cwd(), pluginConfig.path));
        } else if (pluginConfig.type === 'github') {
            PluginClass = await loadPluginFromGithub(pluginConfig.repoUrl, pluginConfig.localPath);
        }

        if (PluginClass) {
            const pluginInstance = new PluginClass(bot);
            pluginInstance.start();
            loadedPlugins.push(pluginInstance);
        }
    }

    return loadedPlugins;
}


module.exports = { initializePlugins };
