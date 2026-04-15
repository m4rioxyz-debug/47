import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaClipboardList, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getLogs } from '../api';
import toast from 'react-hot-toast';

const ACTION_LABELS = {
  MESSAGE_SENT: { label: 'Message Sent', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  EMBED_SENT: { label: 'Embed Sent', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  GIVEAWAY_CREATED: { label: 'Giveaway Created', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  GIVEAWAY_ENDED: { label: 'Giveaway Ended', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ROLE_CREATED: { label: 'Role Created', color: 'text-green-400', bg: 'bg-green-500/10' },
  ROLE_UPDATED: { label: 'Role Updated', color: 'text-green-400', bg: 'bg-green-500/10' },
  ROLE_ASSIGNED: { label: 'Role Assigned', color: 'text-cult-400', bg: 'bg-cult-500/10' },
  ROLE_REMOVED: { label: 'Role Removed', color: 'text-red-400', bg: 'bg-red-500/10' },
  MEMBER_KICKED: { label: 'Member Kicked', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  MEMBER_BANNED: { label: 'Member Banned', color: 'text-red-400', bg: 'bg-red-500/10' },
  AUTO_ROLE_UPDATED: { label: 'Auto-Role Updated', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  CHANNEL_RESET: { label: 'Channel Reset', color: 'text-white/60', bg: 'bg-white/5' },
};

export default function LogsPanel({ guildId }) {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [guildId, page]);

  async function loadLogs() {
    try {
      setLoading(true);
      const data = await getLogs(guildId, page);
      setLogs(data.logs);
      setTotalPages(data.pages);
    } catch (err) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div>
      <h2 className="section-title flex items-center gap-3">
        <FaClipboardList className="text-cult-400" />
        Action Logs
      </h2>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-cult-500/30 border-t-cult-500 rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="glass p-12 text-center">
          <FaClipboardList className="text-5xl text-white/10 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No logs yet.</p>
          <p className="text-white/20 text-sm mt-2">Actions performed through the dashboard will appear here.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log, i) => {
              const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'text-white/50', bg: 'bg-white/5' };

              return (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                  className="glass p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <span className={`text-xs px-3 py-1 rounded-full ${meta.bg} ${meta.color} font-medium shrink-0`}>
                    {meta.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-sm truncate">{log.details}</p>
                    <div className="flex items-center gap-3 text-xs text-white/30 mt-1">
                      {log.performedByName && <span>by {log.performedByName}</span>}
                      {log.targetName && <span>target: {log.targetName}</span>}
                    </div>
                  </div>
                  <span className="text-white/20 text-xs shrink-0">
                    {formatTime(log.createdAt)}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="glass-btn-ghost px-4 py-2 text-sm disabled:opacity-30"
              >
                <FaChevronLeft />
              </button>
              <span className="text-white/40 text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="glass-btn-ghost px-4 py-2 text-sm disabled:opacity-30"
              >
                <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
