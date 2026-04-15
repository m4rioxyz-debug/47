require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const clientId = Buffer.from(process.env.DISCORD_TOKEN.split('.')[0], 'base64').toString();

(async () => {
    try {
        console.log('Started clearing GLOBAL application (/) commands...');
        
        // Clearing global commands
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: [] },
        );

        console.log('Successfully cleared all GLOBAL commands.');
        console.log('Now run "npm run deploy" to set up your SERVER commands.');
    } catch (error) {
        console.error(error);
    }
})();
