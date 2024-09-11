const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

/**
 * Создает резервную копию папки плагина
 */
async function backupPluginFolder(localPath) {
    return new Promise((resolve, reject) => {
        const pluginName = path.basename(localPath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveDir = path.join(localPath, '..', 'archive');
        const backupPath = path.join(archiveDir, `${pluginName}_${timestamp}`);

        fs.mkdir(archiveDir, { recursive: true }, (mkdirErr) => {
            if (mkdirErr) {
                console.error(`Error when creating archive folder: ${mkdirErr.message}`);
                reject(mkdirErr);
            } else {
                copyFolderRecursive(localPath, backupPath, (copyErr) => {
                    if (copyErr) {
                        console.error(`Error when backing up the plugin: ${copyErr.message}`);
                        reject(copyErr);
                    } else {
                        console.log(`Plugin archived: ${backupPath}`);
                        resolve();
                    }
                });
            }
        });
    });
}

/**
 * Рекурсивное копирование папки
 */
function copyFolderRecursive(source, target, callback) {
    fs.access(source, (err) => {
        if (err) {
            return callback(err);
        }

        fs.mkdir(target, { recursive: true }, (mkdirErr) => {
            if (mkdirErr) {
                return callback(mkdirErr);
            }

            fs.readdir(source, (readdirErr, files) => {
                if (readdirErr) {
                    return callback(readdirErr);
                }

                let count = files.length;
                if (count === 0) return callback();

                files.forEach((file) => {
                    const srcPath = path.join(source, file);
                    const destPath = path.join(target, file);

                    fs.stat(srcPath, (statErr, stat) => {
                        if (statErr) {
                            return callback(statErr);
                        }

                        if (stat.isDirectory()) {
                            copyFolderRecursive(srcPath, destPath, (copyErr) => {
                                if (copyErr) {
                                    return callback(copyErr);
                                }
                                if (--count === 0) callback();
                            });
                        } else {
                            fs.copyFile(srcPath, destPath, (copyFileErr) => {
                                if (copyFileErr) {
                                    return callback(copyFileErr);
                                }
                                if (--count === 0) callback();
                            });
                        }
                    });
                });
            });
        });
    });
}

/**
 * Отбрасывает все локальные изменения перед обновлением
 */
async function discardLocalChanges(localPath) {
    return new Promise((resolve, reject) => {
        exec(`git -C ${localPath} reset --hard`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error when resetting local changes: ${stderr}`);
                reject(error);
            } else {
                console.log('All local changes have been reset');
                resolve();
            }
        });
    });
}

/**
 * Обновляет плагин с предварительным резервным копированием и сбросом изменений
 */
async function updatePluginWithBackup(repoUrl, localPath) {
    const hasLocalChanges = await checkForLocalChanges(localPath);

    if (hasLocalChanges) {
        await backupPluginFolder(localPath);
        await discardLocalChanges(localPath);
    }

    return new Promise((resolve, reject) => {
        exec(`git -C ${localPath} pull`, (pullError, stdout, stderr) => {
            if (pullError) {
                console.error(`Error when updating the plugin: ${stderr}`);
                reject(pullError);
            } else {
                console.log(`Plugin successfully updated from ${repoUrl}`);
                resolve();
            }
        });
    });
}

/**
 * Проверяет наличие локальных изменений в репозитории
 */
async function checkForLocalChanges(localPath) {
    return new Promise((resolve, reject) => {
        exec(`git -C ${localPath} status --porcelain`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error when checking local changes: ${stderr}`);
                reject(error);
            } else {
                if (stdout.trim()) {
                    // Есть локальные изменения
                    console.log('Local changes in the plugin have been detected.');
                    resolve(true);
                } else {
                    // Локальных изменений нет
                    resolve(false);
                }
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
        console.log(`The plugin directory does not exist. Cloning from ${repoUrl}`);
        await cloneRepository(repoUrl, localPath);
    } else if (isAllowed) {
        await checkForPluginUpdates(repoUrl, localPath);
    } else {
        console.log(`Plugin update available for ${repoUrl}, but it is not in the list of those allowed for automatic updates.`);
        console.log(`To update manually, perform: git -C ${localPath} pull`);
    }
}

/**
 * Проверка наличия обновлений для плагина
 */
async function checkForPluginUpdates(repoUrl, localPath) {
    return new Promise((resolve, reject) => {
        exec(`git -C ${localPath} fetch`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error when receiving repository updates: ${stderr}`);
                reject(error);
            } else {
                exec(`git -C ${localPath} diff --name-only origin/main`, (diffError, changes) => {
                    if (diffError) {
                        console.error(`Error during change verification: ${diffError}`);
                        reject(diffError);
                    } else if (changes) {
                        console.log(`Detected changes to the plugin from ${repoUrl}: ${changes}`);
                        // Обновляем с резервным копированием и сбросом изменений
                        updatePluginWithBackup(repoUrl, localPath).then(resolve).catch(reject);
                    } else {
                        console.log(`No updates found for plugin from ${repoUrl}`);
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
                console.error(`Error when cloning a repository: ${stderr}`);
                reject(error);
            } else {
                console.log(`The plugin is cloned from ${repoUrl}`);
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
