import { useState, useEffect } from 'react';
import { FaPaperPlane, FaHashtag } from 'react-icons/fa';
import { getChannels, sendMessage as apiSendMessage } from '../api';
import toast from 'react-hot-toast';

export default function SendMessage({ guildId }) {
  const [channels, setChannels] = useState([]);
  const [channelId, setChannelId] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(true);

  useEffect(() => {
    loadChannels();
  }, [guildId]);

  async function loadChannels() {
    try {
      setLoadingChannels(true);
      const data = await getChannels(guildId);
      setChannels(data);
      if (data.length > 0) setChannelId(data[0].id);
    } catch (err) {
      toast.error('Failed to load channels');
    } finally {
      setLoadingChannels(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!channelId || !content.trim()) {
      toast.error('Select a channel and enter a message');
      return;
    }

    setSending(true);
    try {
      await apiSendMessage({ guildId, channelId, content: content.trim() });
      toast.success('Message sent!');
      setContent('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h2 className="section-title flex items-center gap-3">
        <FaPaperPlane className="text-cult-400" />
        Send Message
      </h2>

      <div className="glass p-6 md:p-8">
        <form onSubmit={handleSend} className="space-y-6">
          {/* Channel selector */}
          <div>
            <label className="label">Channel</label>
            {loadingChannels ? (
              <div className="glass-input w-full animate-pulse h-12" />
            ) : (
              <select
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="glass-input w-full appearance-none cursor-pointer"
              >
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id} className="bg-dark-800">
                    #{ch.name} {ch.parentName ? `(${ch.parentName})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Message content */}
          <div>
            <label className="label">Message</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              className="glass-input w-full resize-none"
              maxLength={2000}
            />
            <p className="text-white/20 text-xs mt-1 text-right">
              {content.length}/2000
            </p>
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="glass-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FaPaperPlane />
            )}
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
