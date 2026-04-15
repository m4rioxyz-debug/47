// =====================================================================
//  47 CULT Dashboard — Express Server Entry Point
// =====================================================================

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const connectDB = require('./config/db');
const { getBotClient } = require('./utils/discord');
const Giveaway = require('./models/Giveaway');
const AutoRole = require('./models/AutoRole');
const DashboardUser = require('./models/DashboardUser');

const http = require('http');

// Import root handlers
const { loadEvents } = require('../src/handlers/eventHandler');
const { loadCommands } = require('../src/handlers/commandHandler');

const app = express();
const server = http.createServer(app);

// ─── Start Server (THE ABSOLUTE PRIORITY) ─────────────────────────
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log('================================================');
  console.log(`  [OK] SERVER LISTENING ON PORT: ${PORT}`);
  console.log('================================================');
  
  // Start background tasks
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URL;
  if (mongoURI) connectDB();
  initBot().catch(err => console.error('[BOT] Error:', err.message));
});

server.on('error', (err) => {
  console.error('[FATAL] Server Error:', err.message);
});

// ─── Global Error Handlers ────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[CRITICAL] Unhandled Rejection:', reason);
});

// ─── Middleware ───────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root test route
app.get('/', (req, res) => {
  res.send('47 CULT API is Running');
});

// CORS — allow frontend to make requests
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

// Session — stored in MongoDB for persistence
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || process.env.MONGO_URL,
      ttl: 7 * 24 * 60 * 60, // 7 days
      autoRemove: 'native',
    }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ─── API Routes ──────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/guilds', require('./routes/guilds'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/giveaways', require('./routes/giveaways'));
app.use('/api/members', require('./routes/members'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/logs', require('./routes/logs'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ─── Initialize Bot & Handlers ──────────────────────────────────
async function initBot() {
  try {
    const bot = await getBotClient();

    // Handle giveaway button clicks
    bot.on('interactionCreate', async (interaction) => {
      // ── /addperm command ──
      if (interaction.isChatInputCommand() && interaction.commandName === 'addperm') {
        // Only server owner or admin can use this
        if (!interaction.member.permissions.has(0x8n)) {
          return interaction.reply({
            content: 'Only administrators can use this command.',
            ephemeral: true,
          });
        }

        const username = interaction.options.getString('username');
        const password = interaction.options.getString('password');
        const discordId = interaction.options.getString('userid');

        try {
          // Check if username already exists
          const existing = await DashboardUser.findOne({ username: username.toLowerCase().trim() });
          if (existing) {
            return interaction.reply({
              content: `User **${username}** already exists. Delete it first or choose a different username.`,
              ephemeral: true,
            });
          }

          // Hash password and create user
          const { hash, salt } = DashboardUser.hashPassword(password);
          await DashboardUser.create({
            username: username.toLowerCase().trim(),
            passwordHash: hash,
            salt,
            discordId,
            createdBy: interaction.user.id,
          });

          await interaction.reply({
            content: `Dashboard user created!\n**Username:** ${username}\n**Discord ID:** ${discordId}\n\nThey can now login at the dashboard.`,
            ephemeral: true,
          });

          console.log(`[AUTH] Dashboard user created: ${username} (Discord: ${discordId}) by ${interaction.user.tag}`);
        } catch (err) {
          console.error('[AUTH] addperm error:', err.message);
          await interaction.reply({
            content: `Failed to create user: ${err.message}`,
            ephemeral: true,
          });
        }
        return;
      }

      // ── /removeperm command ──
      if (interaction.isChatInputCommand() && interaction.commandName === 'removeperm') {
        if (!interaction.member.permissions.has(0x8n)) {
          return interaction.reply({
            content: 'Only administrators can use this command.',
            ephemeral: true,
          });
        }

        const username = interaction.options.getString('username');

        try {
          const result = await DashboardUser.findOneAndDelete({ username: username.toLowerCase().trim() });
          if (!result) {
            return interaction.reply({
              content: `User **${username}** not found.`,
              ephemeral: true,
            });
          }

          await interaction.reply({
            content: `Dashboard user **${username}** has been removed.`,
            ephemeral: true,
          });

          console.log(`[AUTH] Dashboard user removed: ${username} by ${interaction.user.tag}`);
        } catch (err) {
          console.error('[AUTH] removeperm error:', err.message);
          await interaction.reply({
            content: `Failed to remove user: ${err.message}`,
            ephemeral: true,
          });
        }
        return;
      }

      // ── Giveaway button handler ──
      if (!interaction.isButton()) return;
      if (interaction.customId !== 'giveaway_join') return;

      try {
        const giveaway = await Giveaway.findOne({
          messageId: interaction.message.id,
          ended: false,
        });

        if (!giveaway) {
          return interaction.reply({
            content: 'This giveaway has ended.',
            ephemeral: true,
          });
        }

        if (giveaway.participants.includes(interaction.user.id)) {
          return interaction.reply({
            content: 'You have already entered this giveaway!',
            ephemeral: true,
          });
        }

        giveaway.participants.push(interaction.user.id);
        await giveaway.save();

        await interaction.reply({
          content: `You have entered the giveaway for **${giveaway.prize}**! (${giveaway.participants.length} entries)`,
          ephemeral: true,
        });
      } catch (err) {
        console.error('[GIVEAWAY] Button error:', err.message);
        await interaction.reply({
          content: 'Something went wrong. Try again!',
          ephemeral: true,
        }).catch(() => {});
      }
    });

    // Handle auto-role on member join
    bot.on('guildMemberAdd', async (member) => {
      try {
        const config = await AutoRole.findOne({
          guildId: member.guild.id,
          enabled: true,
        });

        if (config && config.roleId) {
          const role = member.guild.roles.cache.get(config.roleId);
          if (role) {
            await member.roles.add(role);
            console.log(`[AUTOROLE] Assigned "${role.name}" to ${member.user.username}`);
          }
        }
      } catch (err) {
        console.error('[AUTOROLE] Error:', err.message);
      }
    });

    // Auto-end expired giveaways every 30 seconds
    setInterval(async () => {
      try {
        const expired = await Giveaway.find({
          ended: false,
          endsAt: { $lte: new Date() },
        });

        for (const giveaway of expired) {
          const participants = [...giveaway.participants];
          const winners = [];
          const count = Math.min(giveaway.winnersCount, participants.length);

          for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * participants.length);
            winners.push(participants.splice(idx, 1)[0]);
          }

          giveaway.ended = true;
          giveaway.winners = winners;
          await giveaway.save();

          try {
            const channel = bot.channels.cache.get(giveaway.channelId);
            if (channel) {
              const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
              if (message) {
                const { EmbedBuilder } = require('discord.js');
                const winnerMentions = winners.length > 0
                  ? winners.map((w) => `<@${w}>`).join(', ')
                  : 'No participants';

                const endedEmbed = new EmbedBuilder()
                  .setColor(0xE74C3C)
                  .setTitle('GIVEAWAY ENDED')
                  .setDescription(
                    `**${giveaway.prize}**\n\n` +
                    `**Winner(s):** ${winnerMentions}\n` +
                    `**Entries:** ${giveaway.participants.length}`
                  )
                  .setFooter({ text: '47 CULT Giveaway System' })
                  .setTimestamp();

                await message.edit({ embeds: [endedEmbed], components: [] });

                if (winners.length > 0) {
                  await channel.send(`Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`);
                }
              }
            }
          } catch (msgErr) {
            console.warn('[GIVEAWAY] Auto-end message update failed:', msgErr.message);
          }
        }
      } catch (err) {
        console.error('[GIVEAWAY] Auto-end check error:', err.message);
      }
    }, 30000);

    // Load root handlers (commands and events)
    loadEvents(bot);
    loadCommands(bot);

    console.log('  [BOT] Handlers ready (giveaway, autorole, addperm, removeperm, root handlers)');
  } catch (err) {
    console.error('[BOT] Failed to initialize:', err.message);
  }
}

// ─── Bot Handlers (Internal) ────────────────────────────────────
// (initBot is called in the server.listen callback above)
