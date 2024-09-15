![npm](https://img.shields.io/npm/v/blockmind)

# 🌐 BlockMind Documentation

Это основная документация на **Русском** языке. Вы также можете просмотреть документацию на других языках:

| 🌍 **Доступные языки** | [![EN](https://img.shields.io/badge/lang-English-blue)](./README.md) | [![RU](https://img.shields.io/badge/lang-Russian-red)](./README.ru.md) |
| ---------------------- | -------------------------------------------------------- | -------------------------------------------------------- |

---

## 🛠 Пример проекта

Вы можете найти пример использования библиотеки **BlockMind** в этом репозитории:

🔗 [BlockMind Example Repository](https://github.com/mmeerrkkaa/blockmind-example)

 [Quickstart Readme](https://github.com/mmeerrkkaa/blockmind-example/blob/main/Readme.quickstart.md)

🛠 [Create Custom Database Models](https://github.com/blockmindJS/blockmind-example/blob/main/README_Database_Models.md)

---

# BlockMind

фреймворк для создания ботов на Minecraft-серверах. Легко расширяйте функциональность через кастомные модели, репозитории, команды и плагины.

## 🔑 Основные функции

- **📦 Кастомные модели**  
  Создавайте и интегрируйте собственные модели в бота без лишних усилий. Ваши модели могут храниться в базе данных, либо через SQLite, либо через MongoDB.

- **💬 Система команд**  
  Создавайте команды для взаимодействия с ботом и сервером. Включает в себя проверку разрешений, настройку кулдаунов и аргументов.

- **🔐 Управление ролями и правами**  
  Легко управляйте ролями пользователей и разрешениями через интеграции с SQLite или MongoDB.

- **🔌 Плагины**  
  Поддержка плагинов как на локальном уровне, так и через GitHub-репозитории с функцией автообновления.

- **⚙️ Гибкая конфигурация**  
  Полный контроль над конфигурацией, включая выбор типа базы данных (SQLite или MongoDB), настройку задержек в чате и префиксов команд.

- **📬 Очередь сообщений**  
  Система очередей для управления сообщениями в чате с настраиваемыми задержками для разных типов чатов: локальный, глобальный, клановый, личный.

- **♻️ Автообновление**  
  Автоматически загружайте и применяйте обновления плагинов из GitHub с опцией ручного контроля и автообновления на основе настроек репозитория.

## 🛠 Конфигурация бота

```javascript
const botOptions = {
    host: 'mc.masedworld.net', // localhost 
    username: 'username',
    dbType: 'sqlite',
    version: '1.20.1',
    MC_SERVER: 1,
    customModels: { // Кастомные модели если будут
        sqlite: {
            CustomModel: require('./database/models/custom/customModelSQLite')
        }
    },
    customRepositories: { // Кастомные управляторы если будут
        custom: CustomRepository
    },

    delayConfig: { // Задержа перед отправкой в чат
        local: 444,
        global: 5000,
        clan: 350,
        private: 4500
    },

    pluginsAutoUpdate: true,
    allowedAutoUpdateRepos: [] , // Доверенные репозитории которые автоматически будут обновлятся, если pluginsAutoUpdate = false

    plugins: [
        {
            name: 'ExamplePlugin',
            type: 'github',
            repoUrl: 'https://github.com/blockmindJS/blockmind-examplePlugins',
            localPath: './plugins/CustomExamplePlugin',
            options: {
                // Any options for the plugin can be passed here
            }
        }
    ]
}
```

## 📦 Разработка плагинов

### Создание плагина

Плагины могут быть созданы и интегрированы в вашего бота. Каждый плагин должен быть экспортирован как функция, которая принимает объект бота и параметры.

### Пример структуры плагина

Ваш плагин должен быть расположен в структуре директорий, например:

```
plugins/
│
├── CustomPlugin/
│   ├── src/
│   │   └── CustomPlugin.js
│   └── index.js
```

### index.js

Файл `index.js` отвечает за загрузку плагина и его инициализацию.

```javascript
const CustomPlugin = require('./src/CustomPlugin');

// Функция для загрузки плагина
module.exports = (bot, options) => {
    const plugin = new CustomPlugin(bot, options);

    // Сохранение ссылки на плагин для использования позже
    bot.customPlugins[options.name] = plugin;

    // Запуск плагина
    plugin.start();
};
```

### src/CustomPlugin.js

Это основной файл вашего плагина, где находится вся логика.

```javascript
class CustomPlugin {
    constructor(bot, options = {}) {
        this.bot = bot;
        this.options = options;
    }

    start() {
        console.log('Custom Plugin started');

        this.bot.on('spawn', () => {
            console.log('Bot has spawned in the game');
        });
    }
}

module.exports = CustomPlugin;
```

### Подключение плагина к боту

Чтобы подключить плагин к вашему боту, добавьте его в список плагинов:


```javascript
plugins: [
    {
        name: "CustomPlugin",
        type: "local",
        path: "./plugins/CustomPlugin",
        options: {
            // Здесь можно передать любые опции для плагина
        }
    }
]
```

Его также можно загрузить на github, чтобы передать другому человеку.

```js
plugins: [
        {
            name: 'ExamplePlugin',
            type: 'github',
            repoUrl: 'https://github.com/blockmindJS/blockmind-examplePlugins',
            localPath: './plugins/CustomExamplePlugin',
            options: {
                // Any options for the plugin can be passed here
            }
        }
    ]
```

Так же в папке с ботом может быть папка commands, команды оттуда так же будут интегрированы в основной код бота


## 💬 Создание команд

Достаточно создать папку `command` и создать там новый файл с вашим содержимым. Система автоматически считает любые изменения: создание, удаление или редактирование файлов, и обновит команду.

Пример создания команды:

```javascript
const { Command } = require('blockmind');
class TestCommand extends Command {
    constructor() {
        super({
            name = 'test',
            argsCount = 0,
            permissions = 'user.say',
            allowedChatTypes = ['local', 'private', 'global'],
            cooldown = 0, // ms
            variations = ['test1', 'test2'],
            isActive = true
        });
    }

    async handler(bot, typeChat, user) {
        console.log(user);
        await bot.sendMessage(typeChat, `Команда test выполнена, ${user.username}!`, user.username);
    }
}

module.exports = TestCommand;
```


## 👤 Методы объекта User

- **`blacklist`** (геттер/сеттер): Получает или устанавливает статус о черном списке пользователя(Невозможно взаимодейсовать с ботом

- **`hasPermission(requiredPermissions)`**: Проверяет наличие у пользователя указанных разрешений. Принимает строку или массив разрешений и возвращает `true`/`false`.

- **`getGroups()`**: Возвращает группы пользователя.

- **`addGroup(groupName)`**: Добавляет пользователя в указанную группу по имени.

- **`removeGroup(groupName)`**: Удаляет пользователя из указанной группы по имени.





## Доступные официальные плагины

| Плагин   | Описание                                                                                  | Репозиторий                                                                                                      |
|----------|--------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `auth`   | Плагин для автоматической авторизации и захода на нужный портал у популярных серверах, таких как Mineblaze, Cheatmine, Masedworld  | [github.com/mmeerrkkaa/examplePlugins](https://github.com/mmeerrkkaa/examplePlugins)                              |



### Как подключить плагин

Чтобы подключить плагин, добавьте его в конфигурационный файл вашего проекта.

#### Автоматическое обновление плагинов

- `bot.pluginsAutoUpdate = true` — разрешает автоматически обновлять все подключенные плагины.
- `bot.pluginsAutoUpdate = []` — обновляет только указанные плагины из списка репозиториев, например:
 
```js
bot.pluginsAutoUpdate = ['https://github.com/mmeerrkkaa/examplePlugins'];
```


# 🚀 Quck Start

## 📦 Установка
Чтобы начать работу, установите библиотеку blockmind через npm:

```bash
npm install blockmind
```

## 🛠️ Настройка и запуск бота

Пример базовой настройки для запуска бота:

```javascript
const { createBot } = require('blockmind');
const { commandHandler } = require('blockmind');

const botOptions = {
    host: 'localhost',         // IP of the server
    username: '',              // Bot username
    dbType: 'sqlite',          // Database type. (sqlite, mongo)
    version: '1.20.1',         // Minecraft version
    password: '',              // Password (if required)
    COMMAND_PREFIX: '@',       // Command prefix
};

createBot(botOptions).then(async (bot) => {
    console.log(`Bot is running with prefix: ${bot.COMMAND_PREFIX}`);
    
    // Example chat handling on a local server
    bot.on('chat', async (username, message) => {
        if (!bot.host === 'localhost') return;
        await commandHandler(bot, 'local', username, message);
    });

    // Handling incoming messages
    bot.on('message', async (jsonMsg) => {
        const message = jsonMsg.toString();
        console.log(message);
    });
});
```

## 🔌 Создание пользовательских команд

Чтобы начать создавать свои собственные команды, просто создайте папку `commands` в своем проекте.

Пример тестовой команды:

```javascript
const { Command } = require('blockmind');

class TestCommand extends Command {
    constructor() {
        super({
            name: 'test',
            argsCount: 0,
            permissions: 'user.say',
            allowedChatTypes: ['local', 'private', 'clan'],
            cooldown: 5000,  // Command cooldown time in milliseconds
        });
    }

    // Логика выполнения команд
    async handler(bot, typeChat, user) {
        await bot.sendMessage(typeChat, `Команда test выполнена, ${user.username}!`, user.username);
    }
}

module.exports = TestCommand;
```
