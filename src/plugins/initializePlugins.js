const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

/**
 * Клонирование или обновление репозитория с GitHub
 * @param {string} repoUrl - URL репозитория GitHub
 * @param {string} localPath - Локальный путь для сохранения плагина
 * @param {boolean} autoUpdate - Включено ли автообновление
 * @param {Array<string>} allowedAutoUpdateUrls - Список разрешенных для автообновления URL
 * @returns {Promise<void>}
 */
async function cloneOrUpdateRepository(repoUrl, localPath, autoUpdate, allowedAutoUpdateUrls) {
    const isAllowed = autoUpdate || allowedAutoUpdateUrls.includes(repoUrl);

    if (!fs.existsSync(localPath)) {
        console.log(`Plugin directory does not exist. Cloning from ${repoUrl}`);
        await cloneRepository(repoUrl, localPath);
    } else if (isAllowed) {
        await new Promise((resolve, reject) => {
            exec(`git -C ${localPath} fetch`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error fetching repository updates: ${stderr}`);
                    reject(error);
                } else {
                    exec(`git -C ${localPath} diff --name-only origin/main`, (err, changes) => {
                        if (err) {
                            console.error(`Error checking for changes: ${err}`);
                            reject(err);
                        } else if (changes) {
                            console.log(`Changes detected in plugin at ${repoUrl}: ${changes}`);
                            exec(`git -C ${localPath} pull`, (pullError, pullStdout, pullStderr) => {
                                if (pullError) {
                                    console.error(`Error updating plugin: ${pullStderr}`);
                                    reject(pullError);
                                } else {
                                    console.log(`Plugin updated successfully from ${repoUrl}`);
                                    resolve();
                                }
                            });
                        } else {
                            console.log(`No updates found for plugin at ${repoUrl}`);
                            resolve();
                        }
                    });
                }
            });
        });
    } else {
        // Если автообновление не разрешено
        console.log(`Plugin update available for ${repoUrl}, but it is not in the allowed list for auto-updates.`);
        console.log(`To update manually, run: git -C ${localPath} pull`);
    }
}

/**
 * Проверка наличия обновлений для плагина
 * @param {string} repoUrl - URL репозитория GitHub
 * @param {string} localPath - Локальный путь для сохранения плагина
 */
async function checkForPluginUpdates(repoUrl, localPath) {
    return new Promise((resolve, reject) => {
        exec(`git -C ${localPath} fetch`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error fetching repository updates: ${stderr}`);
                reject(error);
            } else {
                exec(`git -C ${localPath} diff --name-only origin/main`, (err, changes) => {
                    if (err) {
                        console.error(`Error checking for changes: ${err}`);
                        reject(err);
                    } else if (changes) {
                        console.log(`Plugin update available for ${repoUrl}: ${changes}`);
                        console.log(`To update manually, run: git -C ${localPath} pull`);
                        resolve();
                    } else {
                        console.log(`No updates found for plugin at ${repoUrl}`);
                        resolve();
                    }
                });
            }
        });
    });
}

/**
 * Клонирование репозитория
 * @param {string} repoUrl - URL репозитория GitHub
 * @param {string} localPath - Локальный путь для сохранения плагина
 * @returns {Promise<void>}
 */
async function cloneRepository(repoUrl, localPath) {
    return new Promise((resolve, reject) => {
        exec(`git clone ${repoUrl} ${localPath}`, (error, stdout, stderr) => {
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

/**
 * Загрузка плагина с GitHub
 * @param {string} repoUrl - URL репозитория GitHub
 * @param {string} localPath - Локальный путь для сохранения плагина
 * @param {boolean} autoUpdate - Включено ли автообновление
 * @param {Array<string>} allowedAutoUpdateUrls - Список разрешенных для автообновления URL
 * @returns {Promise<Function>} - Возвращает класс плагина
 */
async function loadPluginFromGithub(repoUrl, localPath, autoUpdate, allowedAutoUpdateUrls) {
    await cloneOrUpdateRepository(repoUrl, localPath, autoUpdate, allowedAutoUpdateUrls);
    return require(path.join(localPath, 'index.js'));
}

/**
 * Инициализация плагинов
 * @param {Object} bot - Инстанс бота
 * @param {Array<Object>} plugins - Список конфигураций плагинов
 * @param {boolean} pluginsAutoUpdate - Автообновление плагинов
 * @param {Array<string>} allowedAutoUpdateUrls - Разрешенные для автообновления URL репозиториев
 */
async function initializePlugins(bot, plugins, pluginsAutoUpdate = false, allowedAutoUpdateUrls = []) {
    const loadedPlugins = [];

    for (const pluginConfig of plugins) {
        let PluginClass;

        if (pluginConfig.type === 'local') {
            PluginClass = require(path.resolve(process.cwd(), pluginConfig.path));
        } else if (pluginConfig.type === 'github' || pluginConfig.type === 'git') {
            PluginClass = await loadPluginFromGithub(
                pluginConfig.repoUrl,
                path.resolve(process.cwd(), pluginConfig.localPath),
                pluginsAutoUpdate,
                allowedAutoUpdateUrls
            );
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
