https://github.com/mmeerrkkaa/blockmind-example

## Доступные официальные плагины

| Плагин   | Описание                                                                                  | Репозиторий                                                                                                      |
|----------|--------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `auth`   | Плагин для авторизации на популярных серверах, таких как Mineblaze, Cheatmine, Masedworld  | [github.com/mmeerrkkaa/examplePlugins](https://github.com/mmeerrkkaa/examplePlugins)                              |



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
