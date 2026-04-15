// =====================================================================
//  Model: Log — Bot action audit log
// =====================================================================

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  action: {
    type: String,
    required: true,
    enum: [
      'MESSAGE_SENT',
      'EMBED_SENT',
      'GIVEAWAY_CREATED',
      'GIVEAWAY_ENDED',
      'ROLE_CREATED',
      'ROLE_UPDATED',
      'ROLE_ASSIGNED',
      'ROLE_REMOVED',
      'MEMBER_KICKED',
      'MEMBER_BANNED',
      'AUTO_ROLE_UPDATED',
      'CHANNEL_RESET',
    ],
  },
  details: { type: String, default: '' },
  performedBy: { type: String },         // Discord user ID
  performedByName: { type: String },     // Username for display
  targetId: { type: String },            // Target user/role/channel ID
  targetName: { type: String },          // Target name for display
}, { timestamps: true });

// Auto-expire logs after 30 days
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Log', logSchema);
