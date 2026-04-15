// =====================================================================
//  Routes: Authentication — Username/Password Login
// =====================================================================

const router = require('express').Router();
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const DashboardUser = require('../models/DashboardUser');
const User = require('../models/User');
const { getBotClient } = require('../utils/discord');

// ─── Passport Discord Strategy ────────────────────────────────────
const discordClientID = process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID;
const discordClientSecret = process.env.DISCORD_CLIENT_SECRET || process.env.CLIENT_SECRET;

if (!discordClientID || !discordClientSecret) {
  console.warn('[AUTH] Warning: DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET is missing. Discord login will not work.');
}

passport.use(
  new DiscordStrategy(
    {
      clientID: discordClientID || 'MISSING',
      clientSecret: discordClientSecret || 'MISSING',
      callbackURL: process.env.CALLBACK_URL,
      scope: ['identify', 'guilds', 'guilds.join'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ discordId: profile.id });
        if (!user) {
          user = await User.create({
            discordId: profile.id,
            username: profile.username,
            avatar: profile.avatar,
            accessToken,
            refreshToken,
            guilds: profile.guilds,
          });
        } else {
          user.username = profile.username;
          user.avatar = profile.avatar;
          user.accessToken = accessToken;
          user.refreshToken = refreshToken;
          user.guilds = profile.guilds;
          await user.save();
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// POST /api/auth/login — Login with username and password
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Find user
    const user = await DashboardUser.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Verify password
    if (!user.verifyPassword(password)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Create session
    req.session.userId = user._id.toString();
    req.session.discordId = user.discordId;
    req.session.username = user.username;

    console.log(`[AUTH] Login: ${user.username} (Discord: ${user.discordId})`);

    res.json({
      success: true,
      user: {
        username: user.username,
        discordId: user.discordId,
      },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// GET /api/auth/me — Get current logged-in user info
router.get('/me', (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({
      username: req.session.username,
      discordId: req.session.discordId,
    });
  }
  return res.status(401).json({ error: 'Not authenticated' });
});

// POST /api/auth/logout — Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// ─── Discord OAuth Routes ─────────────────────────────────────────

// GET /api/auth/discord — Start Discord OAuth flow
router.get('/discord', passport.authenticate('discord'));

// GET /api/auth/discord/callback — Discord OAuth callback
router.get(
  '/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/login?error=discord_failed' }),
  async (req, res) => {
    try {
      // ── Logic for Verification Role ──
      const bot = await getBotClient();
      const guildId = '1398798026704949281'; // GUILD_ID from root .env
      const guild = await bot.guilds.fetch(guildId).catch(() => null);

      if (guild) {
        const member = await guild.members.fetch(req.user.discordId).catch(() => null);
        if (member) {
          // Find the role to assign (e.g., Novice 47 or Verified)
          // For now, let's try to find "Novice 47"
          const role = guild.roles.cache.find((r) => r.name === 'Novice 47');
          if (role) {
            await member.roles.add(role);
            console.log(`[VERIFY] Assigned "${role.name}" to ${member.user.tag}`);
          }
        }
      }

      // Redirect to a success page or the dashboard
      res.redirect(`${process.env.CLIENT_URL}/dashboard?verified=true`);
    } catch (err) {
      console.error('[AUTH] Discord callback processing error:', err.message);
      res.redirect(`${process.env.CLIENT_URL}/dashboard?verified=error`);
    }
  }
);

module.exports = router;
