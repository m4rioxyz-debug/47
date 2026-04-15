// =====================================================================
//  Model: EmbedTemplate — Saved embed message templates
// =====================================================================

const mongoose = require('mongoose');

const embedTemplateSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  createdBy: { type: String, required: true },
  name: { type: String, required: true },
  embed: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    color: { type: Number, default: 0x9B59B6 },
    imageUrl: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    footer: { type: String, default: '' },
    fields: [
      {
        name: { type: String },
        value: { type: String },
        inline: { type: Boolean, default: false },
      },
    ],
  },
}, { timestamps: true });

module.exports = mongoose.model('EmbedTemplate', embedTemplateSchema);
