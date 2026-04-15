// =====================================================================
//  Model: DashboardUser — Username/password login for dashboard
// =====================================================================

const mongoose = require('mongoose');
const crypto = require('crypto');

const dashboardUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  discordId: { type: String, required: true },  // Linked Discord user ID
  createdBy: { type: String },                  // Discord ID of who created this user
}, { timestamps: true });

/**
 * Hash a password with a random salt using PBKDF2.
 */
dashboardUserSchema.statics.hashPassword = function (password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
};

/**
 * Verify a password against the stored hash.
 */
dashboardUserSchema.methods.verifyPassword = function (password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 100000, 64, 'sha512').toString('hex');
  return hash === this.passwordHash;
};

module.exports = mongoose.model('DashboardUser', dashboardUserSchema);
