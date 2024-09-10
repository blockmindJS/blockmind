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

async function loadCommands() {
    const commandsDir = path.join(process.cwd(), 'commands');
    console.log(`Loading commands from directory: ${commandsDir}`);

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

    try {
        const dirExists = await fs.promises.access(commandsDir).then(() => true).catch(() => false);

        if (!dirExists) {
            logger.warn(`Директория команд не существует: ${commandsDir}`);
            return commands;
        }

        const files = await fs.promises.readdir(commandsDir);

        if (files.length === 0) {
            logger.warn(`Команды не обнаружены в директории: ${commandsDir}`);
        } else {
            for (const file of files) {
                const filePath = path.join(commandsDir, file);
                console.log(`Loading command from file: ${filePath}`);
                await loadCommand(filePath);
            }
        }
    } catch (error) {
        logger.warn(`Ошибка при начальной загрузке команд: ${error.message}`);
    }

    const watcher = chokidar.watch(commandsDir, { ignored: /^\./, persistent: true });
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

    if (Object.keys(commands).length === 0) {
        logger.warn('Нет доступных команд после загрузки.');
    }

    return commands;
}

module.exports = loadCommands;
