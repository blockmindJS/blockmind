const winston = require('winston');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const Command = require('./Command');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'commands-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'commands.log' }),
    ],
});

const fileToCommandNameMap = {};
const commands = {};

const loadCommand = async (filePath) => {
    try {
        const stat = await fs.promises.stat(filePath);
        if (!stat.isFile()) {
            return;
        }

        delete require.cache[require.resolve(filePath)];
        const CommandClass = require(filePath);
        if (typeof CommandClass === 'function') {
            const commandInstance = new CommandClass();
            if (commandInstance.name) {
                const commandNames = Array.isArray(commandInstance.name) ? commandInstance.name : [commandInstance.name];
                const commandVariations = commandInstance.variations || [];
                const allNames = commandNames.concat(commandVariations);

                allNames.forEach(commandName => {
                    commands[commandName] = commandInstance;
                    logger.info(`Команда ${commandName} загружена.`);
                });
                fileToCommandNameMap[filePath] = allNames;
            } else {
                logger.error(`Ошибка: Не найдено имя для команды в файле ${filePath}`);
            }
        } else {
            logger.error(`Ошибка: ${filePath} не является конструктором класса.`);
        }
    } catch (error) {
        logger.error(`Ошибка при загрузке команды из файла ${filePath}: ${error.message}`);
    }
};

const loadCommandsFromDirectory = async (commandsDir) => {
    try {
        const files = await fs.promises.readdir(commandsDir, { withFileTypes: true });

        for (const file of files) {
            const filePath = path.join(commandsDir, file.name);
            if (file.isDirectory()) {
                // Рекурсивно загружаем команды из поддиректорий
                await loadCommandsFromDirectory(filePath);
            } else {
                await loadCommand(filePath);
            }
        }
    } catch (error) {
        logger.warn(`Ошибка при загрузке команд из директории ${commandsDir}: ${error.message}`);
    }
};

const loadPluginCommandDirectories = async () => {
    const rootDir = path.join(process.cwd(), 'plugins');
    const pluginDirs = [];

    try {
        const subDirs = await fs.promises.readdir(rootDir, { withFileTypes: true });
        for (const subDir of subDirs) {
            if (subDir.isDirectory()) {
                const commandDirPath = path.join(rootDir, subDir.name, 'src/command');
                const exists = await fs.promises.access(commandDirPath).then(() => true).catch(() => false);
                if (exists) {
                    pluginDirs.push(commandDirPath);
                }
            }
        }
    } catch (error) {
        logger.error(`Ошибка при поиске директорий плагинов: ${error.message}`);
    }

    return pluginDirs;
};

async function loadCommands() {
    const commandsDir = path.join(process.cwd(), 'commands');
    console.log(`Loading commands from directory: ${commandsDir}`);

    await loadCommandsFromDirectory(commandsDir);

    const pluginCommandDirs = await loadPluginCommandDirectories();

    for (const pluginCommandDir of pluginCommandDirs) {
        console.log(`Loading plugin commands from directory: ${pluginCommandDir}`);
        await loadCommandsFromDirectory(pluginCommandDir);

        const watcher = chokidar.watch(pluginCommandDir, { ignored: /^\./, persistent: true });
        watcher
            .on('add', loadCommand)
            .on('change', async (filePath) => {
                await loadCommand(filePath);
            })
            .on('unlink', async (filePath) => {
                const commandNames = fileToCommandNameMap[filePath];
                if (commandNames) {
                    commandNames.forEach(commandName => {
                        delete commands[commandName];
                    });
                    delete fileToCommandNameMap[filePath];
                    logger.info(`Команда ${commandNames.join(', ')} удалена из-за удаления файла.`);
                }
            })
            .on('error', error => logger.error(`Ошибка наблюдателя: ${error.message}`));
    }

    if (Object.keys(commands).length === 0) {
        logger.warn('Нет доступных команд после загрузки.');
    }

    return commands;
}

module.exports = loadCommands;
