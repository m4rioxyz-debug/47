// =====================================================================
//  Routes: Members — List, search, kick, ban guild members
// =====================================================================

const router = require('express').Router();
const { isAuthenticated, isGuildAdmin } = require('../middleware/auth');
const { getBotClient } = require('../utils/discord');
const { createLog } = require('../utils/logger');

// GET /api/members/:guildId — List members (paginated)
router.get('/:guildId', isAuthenticated, isGuildAdmin, async (req, res) => {
  try {
    const bot = await getBotClient();
    const guild = bot.guilds.cache.get(req.params.guildId);

    if (!guild) {
      return res.status(404).json({ error: 'Bot is not in this server.' });
    }

    // Fetch members (up to 200)
    const members = await guild.members.fetch({ limit: 200 });
    const search = (req.query.search || '').toLowerCase();

    let memberList = members.map((m) => ({
      id: m.id,
      username: m.user.username,
      displayName: m.displayName,
      avatar: m.user.displayAvatarURL({ size: 64 }),
      roles: m.roles.cache
        .filter((r) => r.id !== guild.id) // exclude @everyone
        .map((r) => ({ id: r.id, name: r.name, color: r.hexColor })),
      joinedAt: m.joinedAt,
      bot: m.user.bot,
    }));

    // Apply search filter
    if (search) {
      memberList = memberList.filter(
        (m) =>
          m.username.toLowerCase().includes(search) ||
          m.displayName.toLowerCase().includes(search) ||
          m.id.includes(search)
      );
    }

    // Sort: non-bots first, then by username
    memberList.sort((a, b) => {
      if (a.bot !== b.bot) return a.bot ? 1 : -1;
      return a.username.localeCompare(b.username);
    });

    res.json(memberList);
  } catch (err) {
    console.error('[MEMBERS] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch members.' });
  }
});

// POST /api/members/:guildId/kick — Kick a member
router.post('/:guildId/kick', isAuthenticated, isGuildAdmin, async (req, res) => {
  try {
    const { memberId, reason } = req.body;
    if (!memberId) return res.status(400).json({ error: 'memberId is required.' });

    const bot = await getBotClient();
    const guild = bot.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Server not found.' });

    const member = await guild.members.fetch(memberId).catch(() => null);
    if (!member) return res.status(404).json({ error: 'Member not found.' });

    if (!member.kickable) {
      return res.status(403).json({ error: 'Bot cannot kick this member (higher role or missing permission).' });
    }

    await member.kick(reason || 'Kicked via dashboard');

    await createLog({
      guildId: req.params.guildId,
      action: 'MEMBER_KICKED',
      details: reason || 'No reason provided',
      performedBy: req.user.discordId,
      performedByName: req.user.username,
      targetId: memberId,
      targetName: member.user.username,
    });

    res.json({ success: true, message: `Kicked ${member.user.username}` });
  } catch (err) {
    console.error('[MEMBERS] Kick error:', err.message);
    res.status(500).json({ error: 'Failed to kick member.' });
  }
});

// POST /api/members/:guildId/ban — Ban a member
router.post('/:guildId/ban', isAuthenticated, isGuildAdmin, async (req, res) => {
  try {
    const { memberId, reason } = req.body;
    if (!memberId) return res.status(400).json({ error: 'memberId is required.' });

    const bot = await getBotClient();
    const guild = bot.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Server not found.' });

    const member = await guild.members.fetch(memberId).catch(() => null);
    if (!member) return res.status(404).json({ error: 'Member not found.' });

    if (!member.bannable) {
      return res.status(403).json({ error: 'Bot cannot ban this member.' });
    }

    await member.ban({ reason: reason || 'Banned via dashboard' });

    await createLog({
      guildId: req.params.guildId,
      action: 'MEMBER_BANNED',
      details: reason || 'No reason provided',
      performedBy: req.user.discordId,
      performedByName: req.user.username,
      targetId: memberId,
      targetName: member.user.username,
    });

    res.json({ success: true, message: `Banned ${member.user.username}` });
  } catch (err) {
    console.error('[MEMBERS] Ban error:', err.message);
    res.status(500).json({ error: 'Failed to ban member.' });
  }
});

// POST /api/members/:guildId/role — Add/remove role from member
router.post('/:guildId/role', isAuthenticated, isGuildAdmin, async (req, res) => {
  try {
    const { memberId, roleId, action } = req.body;
    if (!memberId || !roleId || !action) {
      return res.status(400).json({ error: 'memberId, roleId, and action (add/remove) are required.' });
    }

    const bot = await getBotClient();
    const guild = bot.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Server not found.' });

    const member = await guild.members.fetch(memberId).catch(() => null);
    if (!member) return res.status(404).json({ error: 'Member not found.' });

    const role = guild.roles.cache.get(roleId);
    if (!role) return res.status(404).json({ error: 'Role not found.' });

    if (action === 'add') {
      await member.roles.add(role);
    } else if (action === 'remove') {
      await member.roles.remove(role);
    } else {
      return res.status(400).json({ error: 'action must be "add" or "remove".' });
    }

    await createLog({
      guildId: req.params.guildId,
      action: action === 'add' ? 'ROLE_ASSIGNED' : 'ROLE_REMOVED',
      details: `${action === 'add' ? 'Added' : 'Removed'} role "${role.name}" ${action === 'add' ? 'to' : 'from'} ${member.user.username}`,
      performedBy: req.user.discordId,
      performedByName: req.user.username,
      targetId: memberId,
      targetName: member.user.username,
    });

    res.json({ success: true, message: `Role ${action === 'add' ? 'added' : 'removed'} successfully.` });
  } catch (err) {
    console.error('[MEMBERS] Role error:', err.message);
    res.status(500).json({ error: 'Failed to update role.' });
  }
});

module.exports = router;
