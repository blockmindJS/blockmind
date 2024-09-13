![npm](https://img.shields.io/npm/v/blockmind)

# 🌐 BlockMind Documentation

This is the main documentation in **English**. You can also view the documentation in other languages:

| 🌍 **Languages Available** | [![EN](https://img.shields.io/badge/lang-English-blue)](./README.md) | [![RU](https://img.shields.io/badge/lang-Russian-red)](./README.ru.md) |
| -------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |

---

## 🛠 Example Project

You can find a working example of using the **BlockMind** library in this repository:

🔗 [BlockMind Example Repository](https://github.com/mmeerrkkaa/blockmind-example)

 [Quickstart Readme](https://github.com/mmeerrkkaa/blockmind-example/blob/main/Readme.quickstart.md)

🛠 [Create Custom Database Models](https://github.com/blockmindJS/blockmind-example/blob/main/README_Database_Models.md)

---


# BlockMind

A framework for creating bots on Minecraft servers. Easily extend functionality through custom models, repositories, commands and plugins.

## 🔑 Main Features

- **📦 Custom Models**  
  Create and integrate your own models into the bot with no extra effort. Your models can be stored in a database, either via SQLite or MongoDB.

- **💬 Command System**  
  Create commands to interact with the bot and server. Includes permission checking, setting up cooldowns, and arguments.

- **🔐 Role and Permissions Management**  
  Easily manage user roles and permissions through SQLite or MongoDB integrations.

- **🔌 Plugins**  
  Support plugins both locally and via GitHub repositories with auto-update functionality.

- **⚙️ Flexible Configuration**  
  Full control over configuration, including choosing the database type (SQLite or MongoDB), setting chat delays, and command prefixes.

- **📬 Message Queuing**  
  Queuing system for managing chat messages with customizable delays for different chat types: local, global, clan, private.

- **♻️ Autoupdate**  
  Automatically download and apply plugin updates from GitHub with the option to manually control and autoupdate based on repository settings.

## 🛠 Bot Configuration

```javascript
const botOptions = {
    host: 'mc.masedworld.net', // localhost 
    username: 'username',
    dbType: 'sqlite',
    version: '1.20.1',
    MC_SERVER: 1,
    customModels: { // Custom models if there are any
        sqlite: {
            CustomModel: require('./database/models/custom/customModelSQLite')
        }
    },
    customRepositories: { // Custom controllers, if there are any
        custom: CustomRepository
    },

    delayConfig: { // Delay before sending to chat
        local: 444,
        global: 5000,
        clan: 350,
        private: 4500
    },

    pluginsAutoUpdate: true,
    allowedAutoUpdateRepos: [] , // Trusted repositories that will be automatically updated if pluginsAutoUpdate = false

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


## 📦 Plugin development

### Creating a plug-in

Plugins can be created and integrated into your bot. Each plugin must be exported as a function that accepts a bot object and parameters.

### Example plugin structure

Your plugin should be located in a directory structure such as:

```
plugins/
│
├── CustomPlugin/
│   ├── src/
│   │   └── CustomPlugin.js
│   └── index.js
```

### index.js

The `index.js` file is responsible for loading the plugin and initializing it.

```javascript
const CustomPlugin = require('./src/CustomPlugin');

// Function for loading the plugin
module.exports = (bot, options) => {
    const plugin = new CustomPlugin(bot, options);

    // Saving a link to the plugin for use later
    bot.customPlugins[options.name] = plugin;

    plugin.start();
};
```

### src/CustomPlugin.js

This is the main file of your plugin, where all the logic is located.

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

### Connecting the plugin to the bot

To connect a plugin to your bot, add it to your plugin list:

```javascript
plugins: [
    {
        name: "CustomPlugin",
        type: "local",
        path: "./plugins/CustomPlugin",
        options: {
            // Any options for the plugin can be passed here
        }
    }
]
```

It can also be uploaded to github to be passed on to another person

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
Also in the folder with the bot can be a folder commands, commands from there will also be integrated into the main code of the bot


## 💬 Creating commands

Just create a `command` folder and create a new file with your content there. The system automatically counts any changes: creating, deleting or editing files, and will update the command.

Example of creating a command:

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


## 👤 User object methods

- **`blacklist`** (getter/setter): Gets or sets the user's blacklist status(Unable to interact with the bot

- **`hasPermission(requiredPermissions)`**: Checks if the user has the specified permissions. Accepts a string or array of permissions and returns `true`/`false`.

- **`getGroups()`**: Returns the user's groups.

- **`addGroup(groupName)`**: Adds a user to the specified group by name.

- **`removeGroup(groupName)`**: Removes a user from the specified group by name.




## Available official plug-ins

| Plugin   | Desc                                                                                  | Repository                                                                                                      |
|----------|--------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `auth`   | Plugin for automatic authorization and login to the desired portal on popular servers such as Mineblaze, Cheatmine, Masedworld.  | [github.com/mmeerrkkaa/examplePlugins](https://github.com/mmeerrkkaa/examplePlugins)                              |



### How to connect a plug-in

To connect a plugin, add it to the configuration file of your project.

#### Automatic plugin update

- `bot.pluginsAutoUpdate = true` — allows all connected plugins to be automatically updated.
- `bot.pluginsAutoUpdate = []` — updates only the specified plugins from the repository list, e.g:
 
```js
bot.pluginsAutoUpdate = ['https://github.com/mmeerrkkaa/examplePlugins'];
```
