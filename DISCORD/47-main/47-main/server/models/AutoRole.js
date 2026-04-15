// =====================================================================
//  Model: AutoRole — Auto-role configuration per guild
// =====================================================================

const mongoose = require('mongoose');

const autoRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  roleId: { type: String, default: '' },
  updatedBy: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AutoRole', autoRoleSchema);
