const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

/**
 * Удаляет локальные изменения для package.json перед обновлением
 */
async function removeLocalChangesForPackageJson(localPath) {
    return new Promise((resolve, reject) => {
        exec(`git -C ${localPath} reset HEAD package.json && git -C ${localPath} checkout -- package.json`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error resetting package.json: ${stderr}`);
                reject(error);
            } else {
                console.log('Local changes for package.json discarded');
                resolve();
            }
        });
    });
}

/**
 * Обновляет плагин с удалением изменений в package.json
 */
async function updatePluginWithPackageReset(repoUrl, localPath) {
    await removeLocalChangesForPackageJson(localPath);

    return new Promise((resolve, reject) => {
        exec(`git -C ${localPath} pull`, (pullError, stdout, stderr) => {
            if (pullError) {
                console.error(`Error updating plugin: ${stderr}`);
                reject(pullError);
            } else {
                console.log(`Plugin updated successfully from ${repoUrl}`);
                resolve();
            }
        });
    });
}

/**
 * Клонирование или обновление репозитория с GitHub
 */
async function cloneOrUpdateRepository(repoUrl, localPath, autoUpdate, allowedAutoUpdateUrls) {
    const isAllowed = autoUpdate || allowedAutoUpdateUrls.includes(repoUrl);

    if (!fs.existsSync(localPath)) {
        console.log(`Plugin directory does not exist. Cloning from ${repoUrl}`);
        await cloneRepository(repoUrl, localPath);
    } else if (isAllowed) {
        await checkForPluginUpdates(repoUrl, localPath);
    } else {
        console.log(`Plugin update available for ${repoUrl}, but it is not in the allowed list for auto-updates.`);
        console.log(`To update manually, run: git -C ${localPath} pull`);
    }
}

/**
 * Проверка наличия обновлений для плагина
 */
async function checkForPluginUpdates(repoUrl, localPath) {
    return new Promise((resolve, reject) => {
        exec(`git -C ${localPath} fetch`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error fetching repository updates: ${stderr}`);
                reject(error);
            } else {
                exec(`git -C ${localPath} diff --name-only origin/main`, (diffError, changes) => {
                    if (diffError) {
                        console.error(`Error checking for changes: ${diffError}`);
                        reject(diffError);
                    } else if (changes) {
                        console.log(`Changes detected in plugin at ${repoUrl}: ${changes}`);
                        // Обновляем с сбросом package.json
                        updatePluginWithPackageReset(repoUrl, localPath).then(resolve).catch(reject);
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
 */
async function loadPluginFromGithub(repoUrl, localPath, autoUpdate, allowedAutoUpdateUrls) {
    await cloneOrUpdateRepository(repoUrl, localPath, autoUpdate, allowedAutoUpdateUrls);
    return require(path.join(localPath, 'index.js'));
}

/**
 * Инициализация плагинов
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
