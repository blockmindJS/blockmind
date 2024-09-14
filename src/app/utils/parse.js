// parse.js

function extractUsernameFromClickEvent(clickEvent) {
    if (clickEvent.action === 'suggest_command') {
        const commandValue = clickEvent.value;
        const parts = commandValue.trim().split(/\s+/);
        if (parts.length > 1) {
            return parts[1];
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
            const username = extractClickEvent(part); // Recursive call. Necessary.
            if (username) {
                return username;
            }
        }
    }
    return null;
}

const serverConfigs = {
    'mc.mineblaze.net': {
        arrowChar: '→',
        privatePattern: /\[(.*?)\s+->\s+я\]\s+(.+)/,
    },
    'mc.masedworld.net': {
        arrowChar: '⇨',
        privatePattern: /\[(.*?)\s+->\s+я\]\s+(.+)/,
    },
    'mc.cheatmine.net': {
        arrowChar: '⇨',
        privatePattern: /\[\*\] \[(.*?)\s+([^\[\]\s]+) -> я\] (.+)/,
        specialPrivateCheck: true,
    },
};

async function parseMessage(bot, messageText, jsonMsg) {
    const serverConfig = serverConfigs[bot.host];
    if (!serverConfig) {
        return { error: 'Unknown server' };
    }

    const { arrowChar, privatePattern, specialPrivateCheck } = serverConfig;
    const clanPattern = /КЛАН:\s*(.+?):\s*(.*)/;
    const cleanedMessageText = messageText.replace(/❤\s?/u, '').trim();

    try {
        let match;
        if (specialPrivateCheck && /\я\]/.test(messageText)) {
            match = messageText.match(privatePattern);
            if (match) {
                const nick = extractClickEvent(jsonMsg);
                return { type: 'private', nick, message: match[3] };
            }
        } else {
            match = cleanedMessageText.match(privatePattern);
            if (match) {
                const message = match[2];
                const nick = extractClickEvent(jsonMsg);
                return { type: 'private', nick, message };
            }
        }

        if (/\[ʟ\]/.test(cleanedMessageText)) {
            const arrowIndex = cleanedMessageText.indexOf(arrowChar);
            if (arrowIndex !== -1) {
                const messageContent = cleanedMessageText.substring(arrowIndex + arrowChar.length).trim();
                const nick = extractClickEvent(jsonMsg);
                if (nick) {
                    return { type: 'local', nick, message: messageContent };
                }
            }
        } else if (/\[ɢ\]/.test(cleanedMessageText)) {
            const arrowIndex = cleanedMessageText.indexOf(arrowChar);
            if (arrowIndex !== -1) {
                const messageContent = cleanedMessageText.substring(arrowIndex + arrowChar.length).trim();
                const nick = extractClickEvent(jsonMsg);
                if (nick) {
                    return { type: 'global', nick, message: messageContent };
                }
            }
        } else if (cleanedMessageText.startsWith("КЛАН:")) {
            match = cleanedMessageText.match(clanPattern);
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

module.exports = { parseMessage };
