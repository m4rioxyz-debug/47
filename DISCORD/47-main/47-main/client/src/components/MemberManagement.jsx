import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaSearch, FaUserSlash, FaBan, FaTag, FaTimes } from 'react-icons/fa';
import { getMembers, kickMember, banMember, updateMemberRole, getRoles } from '../api';
import toast from 'react-hot-toast';

export default function MemberManagement({ guildId }) {
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null); // { type, member }
  const [reason, setReason] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [guildId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadMembers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  async function loadData() {
    try {
      setLoading(true);
      const [m, r] = await Promise.all([
        getMembers(guildId),
        getRoles(guildId),
      ]);
      setMembers(m);
      setRoles(r);
    } catch (err) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers() {
    try {
      const m = await getMembers(guildId, search);
      setMembers(m);
    } catch (err) {
      // silently fail for search updates
    }
  }

  async function handleKick() {
    if (!actionModal) return;
    setProcessing(true);
    try {
      await kickMember(guildId, { memberId: actionModal.member.id, reason });
      setMembers((prev) => prev.filter((m) => m.id !== actionModal.member.id));
      toast.success(`Kicked ${actionModal.member.username}`);
      setActionModal(null);
      setReason('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleBan() {
    if (!actionModal) return;
    setProcessing(true);
    try {
      await banMember(guildId, { memberId: actionModal.member.id, reason });
      setMembers((prev) => prev.filter((m) => m.id !== actionModal.member.id));
      toast.success(`Banned ${actionModal.member.username}`);
      setActionModal(null);
      setReason('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleRoleToggle(memberId, roleId, hasRole) {
    try {
      await updateMemberRole(guildId, {
        memberId,
        roleId,
        action: hasRole ? 'remove' : 'add',
      });
      // Refresh member data
      const updated = await getMembers(guildId, search);
      setMembers(updated);
      toast.success(`Role ${hasRole ? 'removed' : 'added'}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <h2 className="section-title flex items-center gap-3">
        <FaUsers className="text-cult-400" />
        Member Management
      </h2>

      {/* Search */}
      <div className="glass p-4 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members by name or ID..."
            className="glass-input w-full pl-11"
          />
        </div>
      </div>

      {/* Member List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-cult-500/30 border-t-cult-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-white/30 text-sm mb-4">{members.length} member(s) found</p>

          {members.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              className="glass p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              {/* Avatar + Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={member.avatar}
                  alt={member.username}
                  className="w-10 h-10 rounded-full ring-2 ring-white/10"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">{member.displayName}</span>
                    {member.bot && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cult-500/20 text-cult-300">BOT</span>
                    )}
                  </div>
                  <span className="text-white/30 text-xs">@{member.username}</span>
                </div>
              </div>

              {/* Roles */}
              <div className="flex flex-wrap gap-1 flex-1">
                {member.roles.slice(0, 5).map((r) => (
                  <span
                    key={r.id}
                    className="text-xs px-2 py-0.5 rounded-full border border-white/10"
                    style={{ color: r.color !== '#000000' ? r.color : 'rgba(255,255,255,0.5)' }}
                  >
                    {r.name}
                  </span>
                ))}
                {member.roles.length > 5 && (
                  <span className="text-xs text-white/30">+{member.roles.length - 5}</span>
                )}
              </div>

              {/* Actions */}
              {!member.bot && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActionModal({ type: 'role', member })}
                    className="p-2 rounded-lg text-white/30 hover:text-cult-400 hover:bg-cult-500/10 transition-colors"
                    title="Manage roles"
                  >
                    <FaTag />
                  </button>
                  <button
                    onClick={() => setActionModal({ type: 'kick', member })}
                    className="p-2 rounded-lg text-white/30 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                    title="Kick"
                  >
                    <FaUserSlash />
                  </button>
                  <button
                    onClick={() => setActionModal({ type: 'ban', member })}
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Ban"
                  >
                    <FaBan />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {actionModal.type === 'kick' && 'Kick Member'}
                {actionModal.type === 'ban' && 'Ban Member'}
                {actionModal.type === 'role' && 'Manage Roles'}
              </h3>
              <button
                onClick={() => { setActionModal(null); setReason(''); }}
                className="text-white/30 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-white/5">
              <img src={actionModal.member.avatar} alt="" className="w-10 h-10 rounded-full" />
              <div>
                <p className="text-white font-semibold">{actionModal.member.displayName}</p>
                <p className="text-white/30 text-xs">@{actionModal.member.username}</p>
              </div>
            </div>

            {(actionModal.type === 'kick' || actionModal.type === 'ban') && (
              <>
                <div className="mb-6">
                  <label className="label">Reason (optional)</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="glass-input w-full"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setActionModal(null); setReason(''); }}
                    className="glass-btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={actionModal.type === 'kick' ? handleKick : handleBan}
                    disabled={processing}
                    className="glass-btn-danger flex-1"
                  >
                    {processing ? 'Processing...' : actionModal.type === 'kick' ? 'Kick' : 'Ban'}
                  </button>
                </div>
              </>
            )}

            {actionModal.type === 'role' && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {roles.filter((r) => !r.managed).map((role) => {
                  const hasRole = actionModal.member.roles.some((r) => r.id === role.id);
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleRoleToggle(actionModal.member.id, role.id, hasRole)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                        hasRole ? 'bg-cult-500/15 border border-cult-500/30' : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                        <span className="text-sm text-white/80">{role.name}</span>
                      </div>
                      {hasRole && <FaTimes className="text-xs text-cult-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
