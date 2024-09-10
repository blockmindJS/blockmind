// parseArguments.js

async function parseArguments(message) {
    const args = [];
    let currentArg = '';
    let inQuotes = false;

    for (let i = 0; i < message.length; i++) {
        const char = message[i];

        if (char === '"' && !inQuotes) {
            inQuotes = true;
            continue;
        }

        if (char === '"' && inQuotes) {
            inQuotes = false;
            args.push(currentArg.trim());
            currentArg = '';
            continue;
        }

        if (char === ' ' && !inQuotes) {
            if (currentArg.length > 0) {
                args.push(currentArg.trim());
                currentArg = '';
            }
            continue;
        }

        currentArg += char;
    }

    if (currentArg.length > 0) {
        args.push(currentArg.trim());
    }

    return args;
}

module.exports = { parseArguments };
