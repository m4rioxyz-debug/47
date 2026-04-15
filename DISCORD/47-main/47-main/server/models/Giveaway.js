// =====================================================================
//  Model: Giveaway — Tracks active and completed giveaways
// =====================================================================

const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true },
  messageId: { type: String },
  createdBy: { type: String, required: true },
  prize: { type: String, required: true },
  description: { type: String, default: '' },
  winnersCount: { type: Number, required: true, default: 1 },
  endsAt: { type: Date, required: true },
  ended: { type: Boolean, default: false },
  participants: [{ type: String }],  // Discord user IDs
  winners: [{ type: String }],       // Discord user IDs
}, { timestamps: true });

// Virtual: is the giveaway still active?
giveawaySchema.virtual('isActive').get(function () {
  return !this.ended && new Date() < this.endsAt;
});

giveawaySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Giveaway', giveawaySchema);
