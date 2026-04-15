const fs = require('fs');
const path = require('path');

function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFolders = fs.readdirSync(commandsPath);
    
    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`../commands/${folder}/${file}`);
            if (command.data && command.data.name) {
                client.commands.set(command.data.name, command);
                client.commandArray.push(command.data.toJSON());
                console.log(`  [LOAD] Loaded command: ${command.data.name}`);
            }
        }
    }
}

module.exports = { loadCommands };
