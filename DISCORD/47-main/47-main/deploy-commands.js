require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./src/commands/${folder}/${file}`);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        }
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        let clientId = config.clientId;
        
        // If clientId is missing, extract it from the token
        if (!clientId) {
            clientId = Buffer.from(process.env.DISCORD_TOKEN.split('.')[0], 'base64').toString();
            console.log(`[Auto] Extracted Client ID: ${clientId}`);
        }

        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        if (config.guildId) {
            // Deploy to a specific guild (Instant)
            await rest.put(
                Routes.applicationGuildCommands(clientId, config.guildId),
                { body: commands },
            );
            console.log(`Successfully reloaded commands for GUILD: ${config.guildId}`);
        } else {
            // Deploy Globally (Can take up to 1 hour)
            await rest.put(
                Routes.applicationCommands(config.clientId),
                { body: commands },
            );
            console.log('Successfully reloaded commands GLOBALLY.');
        }
    } catch (error) {
        console.error(error);
    }
})();
