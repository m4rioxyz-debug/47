import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaGift, FaClock, FaTrophy, FaCheck, FaStop } from 'react-icons/fa';
import { getChannels, getGiveaways, createGiveaway, endGiveaway as apiEndGiveaway } from '../api';
import toast from 'react-hot-toast';

export default function GiveawayPanel({ guildId }) {
  const [channels, setChannels] = useState([]);
  const [giveaways, setGiveaways] = useState([]);
  const [channelId, setChannelId] = useState('');
  const [prize, setPrize] = useState('');
  const [description, setDescription] = useState('');
  const [winnersCount, setWinnersCount] = useState(1);
  const [duration, setDuration] = useState(60); // minutes
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [guildId]);

  async function loadData() {
    try {
      setLoading(true);
      const [ch, gw] = await Promise.all([
        getChannels(guildId),
        getGiveaways(guildId),
      ]);
      setChannels(ch);
      if (ch.length > 0) setChannelId(ch[0].id);
      setGiveaways(gw);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!prize.trim() || !channelId) {
      toast.error('Prize and channel are required');
      return;
    }

    setCreating(true);
    try {
      const gw = await createGiveaway({
        guildId,
        channelId,
        prize: prize.trim(),
        description: description.trim(),
        winnersCount,
        duration,
      });
      setGiveaways((prev) => [gw, ...prev]);
      setPrize('');
      setDescription('');
      toast.success('Giveaway created!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleEnd(id) {
    try {
      const result = await apiEndGiveaway(id);
      setGiveaways((prev) =>
        prev.map((gw) => (gw._id === id ? { ...gw, ended: true, winners: result.winners } : gw))
      );
      toast.success('Giveaway ended!');
    } catch (err) {
      toast.error(err.message);
    }
  }

  function formatDuration(mins) {
    if (mins < 60) return `${mins}m`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${Math.floor(mins / 1440)}d ${Math.floor((mins % 1440) / 60)}h`;
  }

  return (
    <div>
      <h2 className="section-title flex items-center gap-3">
        <FaGift className="text-cult-400" />
        Giveaway System
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Create Form */}
        <div className="glass p-6">
          <h3 className="text-lg font-semibold text-white/80 mb-5">Create Giveaway</h3>

          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="label">Channel</label>
              <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className="glass-input w-full">
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id} className="bg-dark-800">#{ch.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Prize</label>
              <input
                type="text"
                value={prize}
                onChange={(e) => setPrize(e.target.value)}
                placeholder="e.g. Nitro, Gift Card, Role..."
                className="glass-input w-full"
                required
              />
            </div>

            <div>
              <label className="label">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details about the giveaway..."
                rows={3}
                className="glass-input w-full resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Winners</label>
                <input
                  type="number"
                  value={winnersCount}
                  onChange={(e) => setWinnersCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={20}
                  className="glass-input w-full"
                />
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="glass-input w-full"
                />
                <p className="text-white/20 text-xs mt-1">{formatDuration(duration)}</p>
              </div>
            </div>

            <button type="submit" disabled={creating} className="glass-btn-primary w-full flex items-center justify-center gap-2">
              {creating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FaGift />
              )}
              {creating ? 'Creating...' : 'Create Giveaway'}
            </button>
          </form>
        </div>

        {/* Giveaway List */}
        <div className="glass p-6">
          <h3 className="text-lg font-semibold text-white/80 mb-5">Recent Giveaways</h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-cult-500/30 border-t-cult-500 rounded-full animate-spin" />
            </div>
          ) : giveaways.length === 0 ? (
            <p className="text-white/30 text-center py-8">No giveaways yet.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {giveaways.map((gw, i) => (
                <motion.div
                  key={gw._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl border ${
                    gw.ended
                      ? 'bg-white/3 border-white/5'
                      : 'bg-yellow-500/5 border-yellow-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FaTrophy className={gw.ended ? 'text-white/20' : 'text-yellow-400'} />
                        <h4 className="text-white font-semibold truncate">{gw.prize}</h4>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <FaClock />
                          {gw.ended ? 'Ended' : `Ends ${new Date(gw.endsAt).toLocaleString()}`}
                        </span>
                        <span>{gw.participants?.length || 0} entries</span>
                        <span>{gw.winnersCount} winner(s)</span>
                      </div>
                      {gw.ended && gw.winners?.length > 0 && (
                        <p className="text-green-400/60 text-xs mt-2 flex items-center gap-1">
                          <FaCheck /> Winners: {gw.winners.length} selected
                        </p>
                      )}
                    </div>
                    {!gw.ended && (
                      <button
                        onClick={() => handleEnd(gw._id)}
                        className="text-red-400/60 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="End giveaway"
                      >
                        <FaStop />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
