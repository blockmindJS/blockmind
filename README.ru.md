![npm](https://img.shields.io/npm/v/blockmind)

# 🌐 BlockMind Documentation

Это основная документация на **Русском** языке. Вы также можете просмотреть документацию на других языках:

| 🌍 **Доступные языки** | [![EN](https://img.shields.io/badge/lang-English-blue)](./README.md) | [![RU](https://img.shields.io/badge/lang-Russian-red)](./README.ru.md) |
| -------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |

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
        { type: 'github', repoUrl: 'https://github.com/mmeerrkkaa/examplePlugins', localPath: './plugins/CustomAuthPlugin' }
    ]
}
```

## 📦 Разработка плагинов

### Создание плагина

Плагины могут быть созданы и интегрированы в вашего бота. Вот пример:

```javascript
class CustomAuthPlugin {
    constructor(bot) {
        this.bot = bot;
    }

    start() {
        console.log('CustomAuthPlugin started');
        this.bot.on('spawn', async () => {
            // Your logic here
        });
    }
}

module.exports = CustomAuthPlugin;
```

### Добавление плагинов

Вы можете загружать плагины как с локальных путей, так и из GitHub репозиториев:

```javascript
const botOptions = {
    plugins: [
        { type: 'local', path: './plugins/CustomAuthPlugin' },
        { type: 'github', repoUrl: 'https://github.com/your-repo/examplePlugins', localPath: './plugins/examplePlugin' }
    ]
};
```


## 💬 Создание команд

Достаточно создать папку `command` и создать там новый файл с вашим содержимым. Система автоматически считает любые изменения: создание, удаление или редактирование файлов, и обновит команду.

Пример создания команды:

```javascript
const { Command } = require('blockmind');
class TestCommand extends Command {
    constructor() {
        super({
            name: 'test',
            argsCount: 0,
            permissions: 'user.say',
            allowedChatTypes: ['local', 'private']
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

Подключение плагинов происходит в botOptions

```js
const botOptions = {
    plugins: [
        { type: 'github', repoUrl: 'https://github.com/mmeerrkkaa/examplePlugins', localPath: './plugins/CustomAuthPlugin' }
    ]
};
```
