// =====================================================================
//  Routes: Channels — List channels for a guild
// =====================================================================

const router = require('express').Router();
const { isAuthenticated, isGuildAdmin } = require('../middleware/auth');
const { getBotClient } = require('../utils/discord');
const { ChannelType } = require('discord.js');

// GET /api/channels/:guildId — List text channels in a guild
router.get('/:guildId', isAuthenticated, isGuildAdmin, async (req, res) => {
  try {
    const bot = await getBotClient();
    const guild = bot.guilds.cache.get(req.params.guildId);

    if (!guild) {
      return res.status(404).json({ error: 'Bot is not in this server' });
    }

    // Fetch channels and filter to text-based channels
    const channels = guild.channels.cache
      .filter((ch) =>
        ch.type === ChannelType.GuildText ||
        ch.type === ChannelType.GuildAnnouncement
      )
      .map((ch) => ({
        id: ch.id,
        name: ch.name,
        type: ch.type,
        parentId: ch.parentId,
        parentName: ch.parent?.name || null,
        position: ch.position,
      }))
      .sort((a, b) => a.position - b.position);

    res.json(channels);
  } catch (err) {
    console.error('[CHANNELS] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

module.exports = router;
