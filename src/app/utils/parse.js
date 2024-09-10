//parse.js

function extractUsernameFromClickEvent(clickEvent) {
    if (clickEvent.action === 'suggest_command') {
        const regex = /\/msg (\S+) /;
        const match = clickEvent.value.match(regex);
        if (match) {
            return match[1];
        }
    }
    return null;
}

function extractClickEvent(chatMessage) {
    if (chatMessage.clickEvent) {
        const username = extractUsernameFromClickEvent(chatMessage.clickEvent);
        if (username) {
            return username;
        }
    }

    if (chatMessage.extra) {
        for (const part of chatMessage.extra) {
            const username = extractClickEvent(part); // Рекурсивная дрочка. Так надо
            if (username) {
                return username;
            }
        }
    }
    return null;
}

function extractUsernameFromClickEventPrivate(jsonMsg) {
    if (jsonMsg.clickEvent.action === 'suggest_command') {
        const commandValue = jsonMsg.clickEvent.value;
        return commandValue.split(' ')[1].trim();
    }
    return null;
}


async function parseMessage(bot, messageText, jsonMsg) {
    const privatePattern = /\[(.*?)\s+->\s+я\]\s+(.+)/;
    const clanPattern = /КЛАН:\s*(.+?):\s*(.*)/;
    const cleanedMessageText = messageText.replace(/❤\s?/u, '').trim();

    try {
        const match = cleanedMessageText.match(privatePattern);
        if (match) {
            const message = match[2];
            const nick = extractUsernameFromClickEventPrivate(jsonMsg);

            return { type: 'private', nick, message };
        } else if (/\[ʟ\]/.test(cleanedMessageText)) {
            const arrowIndex = cleanedMessageText.indexOf('⇨');
            const prefixText = cleanedMessageText.substring(0, arrowIndex).trim();
            const messageContent = cleanedMessageText.substring(arrowIndex + 1).trim();

            const nick = extractClickEvent(jsonMsg);
            if (nick) {
                return { type: 'local', nick, message: messageContent };
            }
        } else if (/\[ɢ\]/.test(cleanedMessageText)) {
            const arrowIndex = cleanedMessageText.indexOf('⇨');
            const prefixText = cleanedMessageText.substring(0, arrowIndex).trim();
            const messageContent = cleanedMessageText.substring(arrowIndex + 1).trim();

            const nick = extractClickEvent(jsonMsg);
            if (nick) {
                return { type: 'global', nick, message: messageContent };
            }
        } else if (cleanedMessageText.startsWith("КЛАН:")) {
            const match = cleanedMessageText.match(clanPattern);
            if (match) {
                const words = match[1].trim().split(/\s+/);
                const part = words.length > 1 ? words[words.length - 1] : words[0];

                return { type: 'clan', nick: part, message: match[2] };
            }
        }
    } catch (error) {
        return { error: error.message };
    }
}

async function parseTeleportMessage(message) {
    const regex = /(\w+) телепортировал вас к (\w+)/;

    const match = message.match(regex);

    if (match) {
        return { nickname: match[1], message: `${match[1]} телепортировал вас к ${match[2]}.` };
    }
}



module.exports = { parseMessage, parseTeleportMessage };