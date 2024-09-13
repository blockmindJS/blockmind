const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

/**
 * Fetches the latest remote references.
 */
async function fetchRemote(localPath) {
    return new Promise((resolve, reject) => {
        exec(`git -C ${localPath} fetch`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error when fetching remote: ${stderr}`);
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Gets the default remote branch.
 */
async function getDefaultRemoteBranch(localPath) {
    return new Promise((resolve, reject) => {
        exec(`git -C ${localPath} symbolic-ref refs/remotes/origin/HEAD`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error when getting default remote branch: ${stderr}`);
                reject(error);
            } else {
                const branchRef = stdout.trim();
                const match = branchRef.match(/^refs\/remotes\/origin\/(.+)$/);
                if (match) {
                    resolve(match[1]);
                } else {
                    reject(new Error(`Could not determine default remote branch from ${branchRef}`));
                }
            }
        });
    });
}

/**
 * Gets the local version from package.json.
 */
async function getLocalVersion(localPath) {
    return new Promise((resolve, reject) => {
        const packageJsonPath = path.join(localPath, 'package.json');
        fs.readFile(packageJsonPath, 'utf8', (err, data) => {
            if (err) {
                return reject(`Error reading local package.json: ${err.message}`);
            }
            const packageJson = JSON.parse(data);
            resolve(packageJson.version);
        });
    });
}

/**
 * Gets the remote version from package.json.
 */
async function getRemoteVersion(localPath) {
    try {
        const defaultBranch = await getDefaultRemoteBranch(localPath);
        return new Promise((resolve, reject) => {
            exec(`git -C ${localPath} show origin/${defaultBranch}:package.json`, (error, stdout, stderr) => {
                if (error) {
                    return reject(`Error fetching remote package.json: ${stderr}`);
                }
                const packageJson = JSON.parse(stdout);
                resolve(packageJson.version);
            });
        });
    } catch (err) {
        throw new Error(`Error determining default remote branch: ${err.message}`);
    }
}

/**
 * Checks for plugin updates and updates if necessary.
 */
async function checkForPluginUpdates(repoUrl, localPath) {
    await fetchRemote(localPath);

    const localVersion = await getLocalVersion(localPath);
    const remoteVersion = await getRemoteVersion(localPath);

    if (localVersion !== remoteVersion) {
        console.log(`Version change detected: local (${localVersion}), remote (${remoteVersion})`);
        await updatePluginWithBackup(repoUrl, localPath);
    } else {
        console.log('Plugin is up to date.');
    }
}

/**
 * Creates a backup of the plugin folder.
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
 * Recursively copies a folder.
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
 * Discards all local changes before updating.
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
 * Updates the plugin with backup and resets changes.
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
 * Checks for local changes in the repository.
 */
async function checkForLocalChanges(localPath) {
    return new Promise((resolve, reject) => {
        exec(`git -C ${localPath} status --porcelain`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error when checking local changes: ${stderr}`);
                reject(error);
            } else {
                resolve(!!stdout.trim());
            }
        });
    });
}

/**
 * Clones or updates the repository from GitHub.
 */
/**
 * Clones or updates the repository from GitHub.
 */
async function cloneOrUpdateRepository(repoUrl, localPath, autoUpdate = false, allowedAutoUpdateUrls = []) {
    const isAllowed = autoUpdate || (Array.isArray(allowedAutoUpdateUrls) && allowedAutoUpdateUrls.includes(repoUrl));

    if (!fs.existsSync(localPath)) {
        console.log(`The plugin directory does not exist. Cloning from ${repoUrl}`);
        await cloneRepository(repoUrl, localPath);
    } else if (isAllowed) {
        await checkForPluginUpdates(repoUrl, localPath);
    } else {
        console.log(`Plugin update available for ${repoUrl}, but it is not in the list of those allowed for automatic updates.`);
        console.log(`To update manually, perform: git -C ${localPath} pull`);
        console.log(`autoUpdate: ${autoUpdate}`);
        console.log(`allowedAutoUpdateUrls: ${allowedAutoUpdateUrls}`);
    }
}


/**
 * Clones the repository.
 */
async function cloneRepository(repoUrl, localPath) {
    return new Promise((resolve, reject) => {
        exec(`git clone ${repoUrl} ${localPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error when cloning the repository: ${stderr}`);
                reject(error);
            } else {
                console.log(`Plugin cloned from ${repoUrl}`);
                resolve();
            }
        });
    });
}

/**
 * Loads the plugin from GitHub.
 */
async function loadPluginFromGithub(repoUrl, localPath, pluginsAutoUpdate = false, allowedAutoUpdateUrls = []) {
    await cloneOrUpdateRepository(repoUrl, localPath, pluginsAutoUpdate, allowedAutoUpdateUrls);
    return require(path.join(localPath, 'index.js'));
}

/**
 * Initializes plugins.
 */
async function initializePlugins(bot, plugins, pluginsAutoUpdate = false, allowedAutoUpdateUrls = []) {
    if (!bot.customPlugins) {
        bot.customPlugins = {};
    }


    for (const pluginConfig of plugins) {
        let pluginFunction;

        if (pluginConfig.type === 'local') {
            pluginFunction = require(path.resolve(process.cwd(), pluginConfig.path));
        } else if (pluginConfig.type === 'github' || pluginConfig.type === 'git') {
            pluginFunction = await loadPluginFromGithub(
                pluginConfig.repoUrl,
                path.resolve(process.cwd(), pluginConfig.localPath),
                pluginsAutoUpdate,
                allowedAutoUpdateUrls
            );
        }

        if (pluginFunction) {
            const pluginName = pluginConfig.name || pluginFunction.name || 'UnnamedPlugin';

            pluginFunction(bot, { ...pluginConfig.options, name: pluginName });
            console.log(`Плагин ${pluginName} загружен.`);

            if (bot.customPlugins[pluginName]) {
                console.log(`Плагин ${pluginName} успешно добавлен в bot.customPlugins.`);
            } else {
                console.error(`Ошибка при добавлении плагина ${pluginName} в bot.customPlugins.`);
            }
        }
    }
}




module.exports = { initializePlugins };
