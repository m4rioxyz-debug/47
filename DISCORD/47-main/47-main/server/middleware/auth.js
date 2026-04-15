// =====================================================================
//  Middleware: Authentication (Session-based)
// =====================================================================

/**
 * Require the user to be logged in via session.
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated. Please log in.' });
}

/**
 * Require the user to be logged in (guild admin check skipped — 
 * dashboard users are pre-authorized via /addperm command).
 * We still validate guildId exists in the request.
 */
function isGuildAdmin(req, res, next) {
  const guildId = req.params.guildId || req.body.guildId || req.query.guildId;

  if (!guildId) {
    return res.status(400).json({ error: 'guildId is required.' });
  }

  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  req.guildId = guildId;
  return next();
}

module.exports = { isAuthenticated, isGuildAdmin };
