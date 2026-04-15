// =====================================================================
//  Routes: Roles — View, create, edit, delete roles
// =====================================================================

const router = require('express').Router();
const { isAuthenticated, isGuildAdmin } = require('../middleware/auth');
const { getBotClient } = require('../utils/discord');
const { createLog } = require('../utils/logger');
const AutoRole = require('../models/AutoRole');

// GET /api/roles/:guildId — List all roles
router.get('/:guildId', isAuthenticated, isGuildAdmin, async (req, res) => {
  try {
    const bot = await getBotClient();
    const guild = bot.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Server not found.' });

    const roles = guild.roles.cache
      .filter((r) => r.id !== guild.id) // exclude @everyone
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        position: r.position,
        managed: r.managed,
        mentionable: r.mentionable,
        hoist: r.hoist,
        memberCount: r.members.size,
        permissions: r.permissions.toArray(),
      }))
      .sort((a, b) => b.position - a.position);

    res.json(roles);
  } catch (err) {
    console.error('[ROLES] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch roles.' });
  }
});

// POST /api/roles/:guildId/create — Create a new role
router.post('/:guildId/create', isAuthenticated, isGuildAdmin, async (req, res) => {
  try {
    const { name, color, hoist, mentionable } = req.body;
    if (!name) return res.status(400).json({ error: 'Role name is required.' });

    const bot = await getBotClient();
    const guild = bot.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Server not found.' });

    const role = await guild.roles.create({
      name,
      color: color || '#99AAB5',
      hoist: hoist || false,
      mentionable: mentionable || false,
      reason: 'Created via 47 CULT Dashboard',
    });

    await createLog({
      guildId: req.params.guildId,
      action: 'ROLE_CREATED',
      details: `Created role "${name}"`,
      performedBy: req.user.discordId,
      performedByName: req.user.username,
      targetId: role.id,
      targetName: name,
    });

    res.json({
      id: role.id,
      name: role.name,
      color: role.hexColor,
      position: role.position,
    });
  } catch (err) {
    console.error('[ROLES] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create role.' });
  }
});

// PUT /api/roles/:guildId/:roleId — Edit a role
router.put('/:guildId/:roleId', isAuthenticated, isGuildAdmin, async (req, res) => {
  try {
    const { name, color, hoist, mentionable } = req.body;

    const bot = await getBotClient();
    const guild = bot.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Server not found.' });

    const role = guild.roles.cache.get(req.params.roleId);
    if (!role) return res.status(404).json({ error: 'Role not found.' });

    if (role.managed) {
      return res.status(400).json({ error: 'Cannot edit managed (bot/integration) roles.' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (color !== undefined) updates.color = color;
    if (hoist !== undefined) updates.hoist = hoist;
    if (mentionable !== undefined) updates.mentionable = mentionable;

    await role.edit(updates);

    await createLog({
      guildId: req.params.guildId,
      action: 'ROLE_UPDATED',
      details: `Updated role "${role.name}"`,
      performedBy: req.user.discordId,
      performedByName: req.user.username,
      targetId: role.id,
      targetName: role.name,
    });

    res.json({ success: true, message: `Role "${role.name}" updated.` });
  } catch (err) {
    console.error('[ROLES] Edit error:', err.message);
    res.status(500).json({ error: 'Failed to edit role.' });
  }
});

// ─── Auto-Role ──────────────────────────────────────────────────────

// GET /api/roles/:guildId/autorole — Get auto-role config
router.get('/:guildId/autorole', isAuthenticated, isGuildAdmin, async (req, res) => {
  try {
    const config = await AutoRole.findOne({ guildId: req.params.guildId });
    res.json(config || { enabled: false, roleId: '' });
  } catch (err) {
    console.error('[AUTOROLE] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch auto-role config.' });
  }
});

// PUT /api/roles/:guildId/autorole — Update auto-role config
router.put('/:guildId/autorole', isAuthenticated, isGuildAdmin, async (req, res) => {
  try {
    const { enabled, roleId } = req.body;

    const config = await AutoRole.findOneAndUpdate(
      { guildId: req.params.guildId },
      {
        enabled: enabled || false,
        roleId: roleId || '',
        updatedBy: req.user.discordId,
      },
      { upsert: true, new: true }
    );

    await createLog({
      guildId: req.params.guildId,
      action: 'AUTO_ROLE_UPDATED',
      details: `Auto-role ${enabled ? 'enabled' : 'disabled'}${roleId ? ` (role: ${roleId})` : ''}`,
      performedBy: req.user.discordId,
      performedByName: req.user.username,
    });

    res.json(config);
  } catch (err) {
    console.error('[AUTOROLE] Update error:', err.message);
    res.status(500).json({ error: 'Failed to update auto-role config.' });
  }
});

module.exports = router;
