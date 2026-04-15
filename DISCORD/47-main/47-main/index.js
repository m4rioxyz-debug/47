require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User],
});

client.commands = new Collection();
client.commandArray = [];
client.config = require('./config.json');

// Initialize handlers
const { loadEvents } = require('./src/handlers/eventHandler');
const { loadCommands } = require('./src/handlers/commandHandler');
require('./src/handlers/errorHandler')(client);

client.login(process.env.DISCORD_TOKEN).then(() => {
    loadEvents(client);
    loadCommands(client);
}).catch(err => {
    console.error('[Error] Invalid Token or Discord API issue:', err);
});
