import { useState, useEffect } from 'react';
import { FaRobot, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { getRoles, getAutoRole, updateAutoRole } from '../api';
import toast from 'react-hot-toast';

export default function AutoRolePanel({ guildId }) {
  const [roles, setRoles] = useState([]);
  const [enabled, setEnabled] = useState(false);
  const [roleId, setRoleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [guildId]);

  async function loadData() {
    try {
      setLoading(true);
      const [rolesData, config] = await Promise.all([
        getRoles(guildId),
        getAutoRole(guildId),
      ]);
      setRoles(rolesData.filter((r) => !r.managed));
      setEnabled(config.enabled || false);
      setRoleId(config.roleId || '');
    } catch (err) {
      toast.error('Failed to load auto-role config');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (enabled && !roleId) {
      return toast.error('Select a role to assign');
    }

    setSaving(true);
    try {
      await updateAutoRole(guildId, { enabled, roleId });
      toast.success(enabled ? 'Auto-role enabled!' : 'Auto-role disabled');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-cult-500/30 border-t-cult-500 rounded-full animate-spin" />
      </div>
    );
  }

  const selectedRole = roles.find((r) => r.id === roleId);

  return (
    <div>
      <h2 className="section-title flex items-center gap-3">
        <FaRobot className="text-cult-400" />
        Auto-Role
      </h2>

      <div className="glass p-6 md:p-8 max-w-2xl">
        <p className="text-white/40 mb-8">
          Automatically assign a role to new members when they join the server.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-between p-5 rounded-xl bg-white/5 mb-6">
          <div>
            <h3 className="text-white font-semibold">Auto-Role Assignment</h3>
            <p className="text-white/30 text-sm mt-1">
              {enabled ? 'New members will receive a role automatically' : 'Disabled — new members won\'t receive any role'}
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className="text-4xl transition-colors duration-300"
          >
            {enabled ? (
              <FaToggleOn className="text-cult-400" />
            ) : (
              <FaToggleOff className="text-white/20" />
            )}
          </button>
        </div>

        {/* Role selector */}
        {enabled && (
          <div className="mb-6 animate-fade-in">
            <label className="label">Role to Assign</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="glass-input w-full"
            >
              <option value="" className="bg-dark-800">Select a role...</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id} className="bg-dark-800">
                  {role.name}
                </option>
              ))}
            </select>

            {selectedRole && (
              <div className="mt-4 p-4 rounded-xl bg-white/5 flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: selectedRole.color !== '#000000' ? selectedRole.color : '#5865F2' }}
                />
                <div>
                  <p className="text-white font-medium">{selectedRole.name}</p>
                  <p className="text-white/30 text-xs">{selectedRole.memberCount} members currently</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="glass-btn-primary w-full"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
