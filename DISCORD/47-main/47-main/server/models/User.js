// =====================================================================
//  Model: User — Stores Discord OAuth2 user data
// =====================================================================

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  discriminator: { type: String, default: '0' },
  avatar: { type: String },
  accessToken: { type: String },
  refreshToken: { type: String },
  guilds: [
    {
      id: String,
      name: String,
      icon: String,
      owner: Boolean,
      permissions: Number,
      permissions_new: String,
    },
  ],
}, { timestamps: true });

// Virtual: avatar URL
userSchema.virtual('avatarURL').get(function () {
  if (this.avatar) {
    return `https://cdn.discordapp.com/avatars/${this.discordId}/${this.avatar}.png`;
  }
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(this.discordId) % 5}.png`;
});

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
