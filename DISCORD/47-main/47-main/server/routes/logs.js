// =====================================================================
//  Routes: Logs — Audit log for bot actions
// =====================================================================

const router = require('express').Router();
const { isAuthenticated, isGuildAdmin } = require('../middleware/auth');
const Log = require('../models/Log');

// GET /api/logs/:guildId — Get recent logs for a guild
router.get('/:guildId', isAuthenticated, isGuildAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      Log.find({ guildId: req.params.guildId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Log.countDocuments({ guildId: req.params.guildId }),
    ]);

    res.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[LOGS] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch logs.' });
  }
});

module.exports = router;
