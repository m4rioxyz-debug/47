// =====================================================================
//  Routes: Giveaways — Create, manage, and end giveaways
// =====================================================================

const router = require('express').Router();
const { isAuthenticated, isGuildAdmin } = require('../middleware/auth');
const { getBotClient } = require('../utils/discord');
const { createLog } = require('../utils/logger');
const Giveaway = require('../models/Giveaway');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// GET /api/giveaways/:guildId — List giveaways for a guild
router.get('/:guildId', isAuthenticated, isGuildAdmin, async (req, res) => {
  try {
    const giveaways = await Giveaway.find({ guildId: req.params.guildId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(giveaways);
  } catch (err) {
    console.error('[GIVEAWAY] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch giveaways.' });
  }
});

// POST /api/giveaways/create — Create a new giveaway
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    const { guildId, channelId, prize, description, winnersCount, duration } = req.body;

    if (!guildId || !channelId || !prize || !duration) {
      return res.status(400).json({ error: 'guildId, channelId, prize, and duration are required.' });
    }

    const bot = await getBotClient();
    const channel = bot.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found.' });
    }

    // Calculate end time (duration in minutes)
    const endsAt = new Date(Date.now() + duration * 60 * 1000);

    // Create the giveaway embed
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('🎉 GIVEAWAY 🎉')
      .setDescription(
        `**${prize}**\n\n` +
        (description ? `${description}\n\n` : '') +
        `React with the button below to enter!\n\n` +
        `**Winners:** ${winnersCount || 1}\n` +
        `**Ends:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>`
      )
      .setFooter({ text: '47 CULT Giveaway System' })
      .setTimestamp(endsAt);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_join')
        .setLabel('🎉 Enter Giveaway')
        .setStyle(ButtonStyle.Success)
    );

    const message = await channel.send({ embeds: [embed], components: [row] });

    // Save to database
    const giveaway = await Giveaway.create({
      guildId,
      channelId,
      messageId: message.id,
      createdBy: req.user.discordId,
      prize,
      description: description || '',
      winnersCount: winnersCount || 1,
      endsAt,
    });

    await createLog({
      guildId,
      action: 'GIVEAWAY_CREATED',
      details: `Created giveaway: "${prize}" in #${channel.name}`,
      performedBy: req.user.discordId,
      performedByName: req.user.username,
      targetId: channelId,
      targetName: channel.name,
    });

    res.json(giveaway);
  } catch (err) {
    console.error('[GIVEAWAY] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create giveaway.' });
  }
});

// POST /api/giveaways/:id/end — End a giveaway and pick winners
router.post('/:id/end', isAuthenticated, async (req, res) => {
  try {
    const giveaway = await Giveaway.findById(req.params.id);
    if (!giveaway) {
      return res.status(404).json({ error: 'Giveaway not found.' });
    }

    if (giveaway.ended) {
      return res.status(400).json({ error: 'Giveaway has already ended.' });
    }

    // Pick random winners
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

    // Update the giveaway message
    const bot = await getBotClient();
    const channel = bot.channels.cache.get(giveaway.channelId);
    if (channel) {
      try {
        const message = await channel.messages.fetch(giveaway.messageId);
        const winnerMentions = winners.length > 0
          ? winners.map((w) => `<@${w}>`).join(', ')
          : 'No participants';

        const endedEmbed = new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle('🎉 GIVEAWAY ENDED 🎉')
          .setDescription(
            `**${giveaway.prize}**\n\n` +
            `**Winner(s):** ${winnerMentions}\n` +
            `**Entries:** ${giveaway.participants.length}`
          )
          .setFooter({ text: '47 CULT Giveaway System' })
          .setTimestamp();

        await message.edit({ embeds: [endedEmbed], components: [] });

        if (winners.length > 0) {
          await channel.send(`🎉 Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`);
        }
      } catch (msgErr) {
        console.warn('[GIVEAWAY] Could not update message:', msgErr.message);
      }
    }

    await createLog({
      guildId: giveaway.guildId,
      action: 'GIVEAWAY_ENDED',
      details: `Giveaway ended: "${giveaway.prize}" — ${winners.length} winner(s)`,
      performedBy: req.user.discordId,
      performedByName: req.user.username,
    });

    res.json({ success: true, winners });
  } catch (err) {
    console.error('[GIVEAWAY] End error:', err.message);
    res.status(500).json({ error: 'Failed to end giveaway.' });
  }
});

module.exports = router;
