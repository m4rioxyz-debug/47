import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getGuilds, logout as apiLogout } from '../api';
import toast from 'react-hot-toast';
import {
  FaServer, FaPaperPlane, FaPalette, FaGift,
  FaUsers, FaUserShield, FaRobot, FaClipboardList,
  FaSignOutAlt, FaBars, FaTimes,
} from 'react-icons/fa';

import ServerSelector from '../components/ServerSelector';
import SendMessage from '../components/SendMessage';
import EmbedBuilder from '../components/EmbedBuilder';
import GiveawayPanel from '../components/GiveawayPanel';
import MemberManagement from '../components/MemberManagement';
import RoleManagement from '../components/RoleManagement';
import AutoRolePanel from '../components/AutoRolePanel';
import LogsPanel from '../components/LogsPanel';

const NAV_ITEMS = [
  { key: 'servers', label: 'Servers', icon: FaServer },
  { key: 'message', label: 'Send Message', icon: FaPaperPlane },
  { key: 'embed', label: 'Embed Builder', icon: FaPalette },
  { key: 'giveaway', label: 'Giveaways', icon: FaGift },
  { key: 'members', label: 'Members', icon: FaUsers },
  { key: 'roles', label: 'Roles', icon: FaUserShield },
  { key: 'autorole', label: 'Auto-Role', icon: FaRobot },
  { key: 'logs', label: 'Logs', icon: FaClipboardList },
];

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('servers');
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadGuilds();
  }, []);

  async function loadGuilds() {
    try {
      setLoading(true);
      const data = await getGuilds();
      setGuilds(data);
    } catch (err) {
      toast.error('Failed to load servers');
    } finally {
      setLoading(false);
    }
  }

  function selectGuild(guild) {
    setSelectedGuild(guild);
    setActiveTab('message');
    setSidebarOpen(false);
    toast.success(`Selected ${guild.name}`);
  }

  async function handleLogout() {
    try {
      await apiLogout();
      setUser(null);
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  }

  function renderPanel() {
    if (activeTab === 'servers') {
      return (
        <ServerSelector
          guilds={guilds}
          loading={loading}
          selected={selectedGuild}
          onSelect={selectGuild}
        />
      );
    }

    if (!selectedGuild) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <FaServer className="text-6xl text-white/10 mb-6" />
          <h2 className="text-2xl font-display font-bold text-white/30 mb-2">
            No Server Selected
          </h2>
          <p className="text-white/20 max-w-md">
            Select a server from the Servers tab to get started.
          </p>
          <button
            onClick={() => setActiveTab('servers')}
            className="mt-6 glass-btn-primary"
          >
            Select a Server
          </button>
        </div>
      );
    }

    const props = { guildId: selectedGuild.id, guildName: selectedGuild.name };

    switch (activeTab) {
      case 'message': return <SendMessage {...props} />;
      case 'embed': return <EmbedBuilder {...props} />;
      case 'giveaway': return <GiveawayPanel {...props} />;
      case 'members': return <MemberManagement {...props} />;
      case 'roles': return <RoleManagement {...props} />;
      case 'autorole': return <AutoRolePanel {...props} />;
      case 'logs': return <LogsPanel {...props} />;
      default: return null;
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 glass border-r border-white/5 flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <h1 className="font-display text-2xl font-bold">
            <span className="bg-gradient-to-r from-cult-400 to-cult-500 bg-clip-text text-transparent">47</span>
            <span className="text-white/80"> CULT</span>
          </h1>
          <p className="text-white/30 text-xs mt-1">Dashboard v1.0</p>
        </div>

        {/* User info */}
        {user && (
          <div className="p-4 mx-3 mt-3 rounded-xl bg-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full ring-2 ring-cult-500/30 bg-gradient-to-br from-cult-500 to-cult-700 flex items-center justify-center text-white font-bold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.username}</p>
              <p className="text-xs text-white/30">Administrator</p>
            </div>
          </div>
        )}

        {/* Selected server */}
        {selectedGuild && (
          <div className="px-4 mt-3">
            <div className="p-3 rounded-xl bg-cult-500/10 border border-cult-500/20 flex items-center gap-3">
              {selectedGuild.icon ? (
                <img src={selectedGuild.icon} alt="" className="w-8 h-8 rounded-lg" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-cult-500/30 flex items-center justify-center text-sm font-bold">
                  {selectedGuild.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{selectedGuild.name}</p>
                <p className="text-[10px] text-cult-300/60">Active Server</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 mt-4 overflow-y-auto">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.key;
              const needsGuild = item.key !== 'servers';
              const disabled = needsGuild && !selectedGuild;

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    if (!disabled) {
                      setActiveTab(item.key);
                      setSidebarOpen(false);
                    }
                  }}
                  disabled={disabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-cult-500/20 text-cult-300 border border-cult-500/30'
                      : disabled
                      ? 'text-white/20 cursor-not-allowed'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`text-lg ${isActive ? 'text-cult-400' : ''}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <FaSignOutAlt />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-white/5 text-white/60"
          >
            <FaBars />
          </button>
          <h1 className="font-display text-lg font-bold">
            <span className="text-cult-400">47</span> CULT
          </h1>
          <div className="w-10" />
        </div>

        {/* Panel content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
