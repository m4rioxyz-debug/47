// =====================================================================
//  Routes: Messages — Send messages and embeds
// =====================================================================

const router = require('express').Router();
const { isAuthenticated, isGuildAdmin } = require('../middleware/auth');
const { getBotClient } = require('../utils/discord');
const { createLog } = require('../utils/logger');
const EmbedTemplate = require('../models/EmbedTemplate');
const { EmbedBuilder } = require('discord.js');

// POST /api/messages/send — Send a plain text message
router.post('/send', isAuthenticated, async (req, res) => {
  try {
    const { guildId, channelId, content } = req.body;

    if (!guildId || !channelId || !content) {
      return res.status(400).json({ error: 'guildId, channelId, and content are required.' });
    }

    // Verify guild admin
    const user = req.user;
    const guild = user.guilds.find((g) => g.id === guildId);
    const perms = parseInt(guild?.permissions_new || guild?.permissions || 0);
    if (!guild?.owner && (perms & 0x8) !== 0x8) {
      return res.status(403).json({ error: 'Not an admin of this server.' });
    }

    const bot = await getBotClient();
    const channel = bot.channels.cache.get(channelId);

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found.' });
    }

    await channel.send(content);

    await createLog({
      guildId,
      action: 'MESSAGE_SENT',
      details: `Sent message to #${channel.name}`,
      performedBy: user.discordId,
      performedByName: user.username,
      targetId: channelId,
      targetName: channel.name,
    });

    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('[MESSAGES] Send error:', err.message);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// POST /api/messages/send-embed — Send an embed message
router.post('/send-embed', isAuthenticated, async (req, res) => {
  try {
    const { guildId, channelId, embed } = req.body;

    if (!guildId || !channelId || !embed) {
      return res.status(400).json({ error: 'guildId, channelId, and embed data are required.' });
    }

    const user = req.user;
    const guild = user.guilds.find((g) => g.id === guildId);
    const perms = parseInt(guild?.permissions_new || guild?.permissions || 0);
    if (!guild?.owner && (perms & 0x8) !== 0x8) {
      return res.status(403).json({ error: 'Not an admin of this server.' });
    }

    const bot = await getBotClient();
    const channel = bot.channels.cache.get(channelId);

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found.' });
    }

    // Build the embed
    const embedBuilder = new EmbedBuilder();
    if (embed.title) embedBuilder.setTitle(embed.title);
    if (embed.description) embedBuilder.setDescription(embed.description);
    if (embed.color !== undefined) embedBuilder.setColor(embed.color);
    if (embed.imageUrl) embedBuilder.setImage(embed.imageUrl);
    if (embed.thumbnailUrl) embedBuilder.setThumbnail(embed.thumbnailUrl);
    if (embed.footer) embedBuilder.setFooter({ text: embed.footer });
    if (embed.fields && embed.fields.length > 0) {
      embedBuilder.addFields(embed.fields.filter((f) => f.name && f.value));
    }
    embedBuilder.setTimestamp();

    await channel.send({ embeds: [embedBuilder] });

    await createLog({
      guildId,
      action: 'EMBED_SENT',
      details: `Sent embed "${embed.title || 'Untitled'}" to #${channel.name}`,
      performedBy: user.discordId,
      performedByName: user.username,
      targetId: channelId,
      targetName: channel.name,
    });

    res.json({ success: true, message: 'Embed sent successfully.' });
  } catch (err) {
    console.error('[MESSAGES] Embed error:', err.message);
    res.status(500).json({ error: 'Failed to send embed.' });
  }
});

// ─── Embed Templates ────────────────────────────────────────────────

// GET /api/messages/templates/:guildId — List saved embed templates
router.get('/templates/:guildId', isAuthenticated, async (req, res) => {
  try {
    const templates = await EmbedTemplate.find({ guildId: req.params.guildId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(templates);
  } catch (err) {
    console.error('[TEMPLATES] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch templates.' });
  }
});

// POST /api/messages/templates — Save a new embed template
router.post('/templates', isAuthenticated, async (req, res) => {
  try {
    const { guildId, name, embed } = req.body;

    if (!guildId || !name || !embed) {
      return res.status(400).json({ error: 'guildId, name, and embed are required.' });
    }

    const template = await EmbedTemplate.create({
      guildId,
      createdBy: req.user.discordId,
      name,
      embed,
    });

    res.json(template);
  } catch (err) {
    console.error('[TEMPLATES] Save error:', err.message);
    res.status(500).json({ error: 'Failed to save template.' });
  }
});

// DELETE /api/messages/templates/:id — Delete a template
router.delete('/templates/:id', isAuthenticated, async (req, res) => {
  try {
    await EmbedTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[TEMPLATES] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete template.' });
  }
});

module.exports = router;
