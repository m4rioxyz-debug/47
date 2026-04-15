// =====================================================================
//  Utility: Create an audit log entry
// =====================================================================

const Log = require('../models/Log');

/**
 * Create a log entry for an action taken through the dashboard.
 */
async function createLog({ guildId, action, details, performedBy, performedByName, targetId, targetName }) {
  try {
    await Log.create({
      guildId,
      action,
      details,
      performedBy,
      performedByName,
      targetId,
      targetName,
    });
  } catch (err) {
    console.error('[LOG] Failed to create log:', err.message);
  }
}

module.exports = { createLog };
