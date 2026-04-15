import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPalette, FaSave, FaTrash, FaPaperPlane, FaPlus } from 'react-icons/fa';
import { getChannels, sendEmbed, getTemplates, saveTemplate, deleteTemplate as apiDeleteTemplate } from '../api';
import toast from 'react-hot-toast';

const DEFAULT_EMBED = {
  title: '',
  description: '',
  color: 0x9B59B6,
  imageUrl: '',
  thumbnailUrl: '',
  footer: '',
  fields: [],
};

export default function EmbedBuilder({ guildId }) {
  const [channels, setChannels] = useState([]);
  const [channelId, setChannelId] = useState('');
  const [embed, setEmbed] = useState({ ...DEFAULT_EMBED });
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [guildId]);

  async function loadData() {
    try {
      const [ch, tpl] = await Promise.all([
        getChannels(guildId),
        getTemplates(guildId),
      ]);
      setChannels(ch);
      if (ch.length > 0) setChannelId(ch[0].id);
      setTemplates(tpl);
    } catch (err) {
      toast.error('Failed to load data');
    }
  }

  function updateEmbed(key, value) {
    setEmbed((prev) => ({ ...prev, [key]: value }));
  }

  function addField() {
    setEmbed((prev) => ({
      ...prev,
      fields: [...prev.fields, { name: '', value: '', inline: false }],
    }));
  }

  function updateField(index, key, value) {
    setEmbed((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => (i === index ? { ...f, [key]: value } : f)),
    }));
  }

  function removeField(index) {
    setEmbed((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  }

  async function handleSend() {
    if (!channelId) return toast.error('Select a channel');
    if (!embed.title && !embed.description) return toast.error('Add a title or description');

    setSending(true);
    try {
      await sendEmbed({ guildId, channelId, embed });
      toast.success('Embed sent!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) return toast.error('Enter a template name');

    setSaving(true);
    try {
      const tpl = await saveTemplate({ guildId, name: templateName.trim(), embed });
      setTemplates((prev) => [tpl, ...prev]);
      setTemplateName('');
      toast.success('Template saved!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTemplate(id) {
    try {
      await apiDeleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
      toast.success('Template deleted');
    } catch (err) {
      toast.error(err.message);
    }
  }

  function loadTemplate(tpl) {
    setEmbed(tpl.embed);
    toast.success(`Loaded "${tpl.name}"`);
  }

  // Convert hex color number to hex string for input
  const colorHex = `#${(embed.color || 0).toString(16).padStart(6, '0')}`;

  return (
    <div>
      <h2 className="section-title flex items-center gap-3">
        <FaPalette className="text-cult-400" />
        Embed Builder
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Builder Form */}
        <div className="glass p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white/80">Build Your Embed</h3>

          {/* Channel */}
          <div>
            <label className="label">Channel</label>
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="glass-input w-full"
            >
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id} className="bg-dark-800">
                  #{ch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="label">Title</label>
            <input
              type="text"
              value={embed.title}
              onChange={(e) => updateEmbed('title', e.target.value)}
              placeholder="Embed title"
              className="glass-input w-full"
              maxLength={256}
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              value={embed.description}
              onChange={(e) => updateEmbed('description', e.target.value)}
              placeholder="Embed description (supports Discord markdown)"
              rows={4}
              className="glass-input w-full resize-none"
              maxLength={4096}
            />
          </div>

          {/* Color */}
          <div>
            <label className="label">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => updateEmbed('color', parseInt(e.target.value.slice(1), 16))}
                className="w-12 h-12 rounded-xl border-0 cursor-pointer bg-transparent"
              />
              <span className="text-white/40 text-sm font-mono">{colorHex.toUpperCase()}</span>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="label">Image URL</label>
            <input
              type="url"
              value={embed.imageUrl}
              onChange={(e) => updateEmbed('imageUrl', e.target.value)}
              placeholder="https://..."
              className="glass-input w-full"
            />
          </div>

          {/* Footer */}
          <div>
            <label className="label">Footer</label>
            <input
              type="text"
              value={embed.footer}
              onChange={(e) => updateEmbed('footer', e.target.value)}
              placeholder="Footer text"
              className="glass-input w-full"
              maxLength={2048}
            />
          </div>

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Fields</label>
              <button onClick={addField} className="text-cult-400 hover:text-cult-300 text-sm flex items-center gap-1">
                <FaPlus className="text-xs" /> Add Field
              </button>
            </div>
            {embed.fields.map((field, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 mb-3 space-y-3">
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => updateField(i, 'name', e.target.value)}
                  placeholder="Field name"
                  className="glass-input w-full text-sm py-2"
                />
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => updateField(i, 'value', e.target.value)}
                  placeholder="Field value"
                  className="glass-input w-full text-sm py-2"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-white/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.inline}
                      onChange={(e) => updateField(i, 'inline', e.target.checked)}
                      className="rounded bg-white/10 border-white/20"
                    />
                    Inline
                  </label>
                  <button onClick={() => removeField(i)} className="text-red-400/60 hover:text-red-400 text-sm">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button onClick={handleSend} disabled={sending} className="glass-btn-primary flex items-center gap-2 flex-1">
              <FaPaperPlane /> {sending ? 'Sending...' : 'Send Embed'}
            </button>
          </div>

          {/* Save as template */}
          <div className="flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name..."
              className="glass-input flex-1 text-sm py-2"
            />
            <button onClick={handleSaveTemplate} disabled={saving} className="glass-btn-ghost text-sm px-4 py-2 flex items-center gap-2">
              <FaSave /> Save
            </button>
          </div>
        </div>

        {/* Preview + Templates */}
        <div className="space-y-6">
          {/* Live Preview */}
          <div className="glass p-6">
            <h3 className="text-lg font-semibold text-white/80 mb-4">Live Preview</h3>
            <div
              className="rounded-lg p-4 border-l-4"
              style={{ borderColor: colorHex, backgroundColor: 'rgba(47, 49, 54, 0.8)' }}
            >
              {embed.title && (
                <h4 className="text-white font-semibold text-lg mb-2">{embed.title}</h4>
              )}
              {embed.description && (
                <p className="text-white/70 text-sm whitespace-pre-wrap mb-3">{embed.description}</p>
              )}
              {embed.fields.length > 0 && (
                <div className="grid grid-cols-1 gap-2 mb-3">
                  {embed.fields.map((f, i) => (
                    <div key={i} className={f.inline ? 'inline-block mr-4' : ''}>
                      {f.name && <span className="text-white font-semibold text-sm block">{f.name}</span>}
                      {f.value && <span className="text-white/60 text-sm">{f.value}</span>}
                    </div>
                  ))}
                </div>
              )}
              {embed.imageUrl && (
                <img src={embed.imageUrl} alt="" className="rounded-lg max-w-full max-h-48 mt-2 object-cover" />
              )}
              {embed.footer && (
                <p className="text-white/30 text-xs mt-3 pt-2 border-t border-white/10">{embed.footer}</p>
              )}
              {!embed.title && !embed.description && (
                <p className="text-white/20 text-sm italic">Your embed preview will appear here...</p>
              )}
            </div>
          </div>

          {/* Saved Templates */}
          <div className="glass p-6">
            <h3 className="text-lg font-semibold text-white/80 mb-4">Saved Templates</h3>
            {templates.length === 0 ? (
              <p className="text-white/30 text-sm">No templates saved yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {templates.map((tpl) => (
                  <div
                    key={tpl._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <button
                      onClick={() => loadTemplate(tpl)}
                      className="text-white/70 hover:text-white text-sm font-medium flex-1 text-left"
                    >
                      {tpl.name}
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(tpl._id)}
                      className="text-red-400/40 hover:text-red-400 p-1"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
