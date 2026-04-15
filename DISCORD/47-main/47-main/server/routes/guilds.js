// =====================================================================
//  Routes: Guilds — Server selection & info
// =====================================================================

const router = require('express').Router();
const { isAuthenticated } = require('../middleware/auth');
const { getBotClient } = require('../utils/discord');

// GET /api/guilds — List all guilds the bot is in
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const bot = await getBotClient();

    const guilds = bot.guilds.cache.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL({ size: 128 }),
      memberCount: g.memberCount,
    }));

    res.json(guilds);
  } catch (err) {
    console.error('[GUILDS] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch guilds' });
  }
});

// GET /api/guilds/:guildId/info — Detailed guild info
router.get('/:guildId/info', isAuthenticated, async (req, res) => {
  try {
    const bot = await getBotClient();
    const guild = bot.guilds.cache.get(req.params.guildId);

    if (!guild) {
      return res.status(404).json({ error: 'Bot is not in this server' });
    }

    res.json({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ size: 128 }),
      memberCount: guild.memberCount,
      createdAt: guild.createdAt,
    });
  } catch (err) {
    console.error('[GUILDS] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch guild info' });
  }
});

module.exports = router;
