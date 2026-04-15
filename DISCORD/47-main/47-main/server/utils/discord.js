// =====================================================================
//  Utility: Discord Bot Client (shared instance)
// =====================================================================

const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');

let botClient = null;

/**
 * Initialize the Discord bot client.
 * Returns the existing client if already initialized.
 */
async function getBotClient() {
  if (botClient && botClient.isReady()) {
    return botClient;
  }

  botClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildPresences,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User],
  });

  // Initialize command collections needed by handlers
  botClient.commands = new Collection();
  botClient.commandArray = [];
  
  // Load config into client for event handlers to access
  try {
    botClient.config = require('../../config.json');
    console.log('  [BOT] Configuration loaded into client.');
  } catch (err) {
    console.warn('  [WARN] Failed to load config.json into client:', err.message);
  }

  await botClient.login(process.env.DISCORD_TOKEN);

  return new Promise((resolve) => {
    if (botClient.isReady()) {
      resolve(botClient);
    } else {
      botClient.once('ready', () => {
        console.log(`  [BOT] Discord bot ready: ${botClient.user.tag}`);
        resolve(botClient);
      });
    }
  });
}

module.exports = { getBotClient };
