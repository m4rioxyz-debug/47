import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserShield, FaPlus, FaEdit, FaTimes, FaUsers } from 'react-icons/fa';
import { getRoles, createRole, editRole } from '../api';
import toast from 'react-hot-toast';

export default function RoleManagement({ guildId }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#9B59B6', hoist: false, mentionable: false });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRoles();
  }, [guildId]);

  async function loadRoles() {
    try {
      setLoading(true);
      const data = await getRoles(guildId);
      setRoles(data);
    } catch (err) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setFormData({ name: '', color: '#9B59B6', hoist: false, mentionable: false });
    setEditingRole(null);
    setShowCreate(true);
  }

  function openEdit(role) {
    setFormData({
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      mentionable: role.mentionable,
    });
    setEditingRole(role);
    setShowCreate(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Role name is required');

    setProcessing(true);
    try {
      if (editingRole) {
        await editRole(guildId, editingRole.id, formData);
        toast.success(`Updated "${formData.name}"`);
      } else {
        await createRole(guildId, formData);
        toast.success(`Created "${formData.name}"`);
      }
      setShowCreate(false);
      loadRoles();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title flex items-center gap-3 mb-0">
          <FaUserShield className="text-cult-400" />
          Roles
        </h2>
        <button onClick={openCreate} className="glass-btn-primary flex items-center gap-2 text-sm">
          <FaPlus /> Create Role
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-cult-500/30 border-t-cult-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {roles.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
              className="glass p-4 flex items-center gap-4"
            >
              <div
                className="w-5 h-5 rounded-full ring-2 ring-white/10 shrink-0"
                style={{ backgroundColor: role.color !== '#000000' ? role.color : '#5865F2' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium truncate">{role.name}</span>
                  {role.managed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/30">
                      Managed
                    </span>
                  )}
                  {role.hoist && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cult-500/20 text-cult-300">
                      Hoisted
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/30 mt-1">
                  <span className="flex items-center gap-1"><FaUsers className="text-[10px]" /> {role.memberCount}</span>
                  <span>Position: {role.position}</span>
                </div>
              </div>
              {!role.managed && (
                <button
                  onClick={() => openEdit(role)}
                  className="p-2 rounded-lg text-white/30 hover:text-cult-400 hover:bg-cult-500/10 transition-colors"
                >
                  <FaEdit />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingRole ? 'Edit Role' : 'Create Role'}
              </h3>
              <button onClick={() => setShowCreate(false)} className="text-white/30 hover:text-white">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Role name"
                  className="glass-input w-full"
                  required
                />
              </div>

              <div>
                <label className="label">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                    className="w-12 h-12 rounded-xl border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-white/40 text-sm font-mono">{formData.color.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hoist}
                    onChange={(e) => setFormData((p) => ({ ...p, hoist: e.target.checked }))}
                    className="rounded bg-white/10 border-white/20"
                  />
                  Display separately
                </label>
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.mentionable}
                    onChange={(e) => setFormData((p) => ({ ...p, mentionable: e.target.checked }))}
                    className="rounded bg-white/10 border-white/20"
                  />
                  Mentionable
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="glass-btn-ghost flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={processing} className="glass-btn-primary flex-1">
                  {processing ? 'Saving...' : editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
