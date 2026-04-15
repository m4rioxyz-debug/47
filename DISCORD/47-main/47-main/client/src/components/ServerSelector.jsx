import { motion } from 'framer-motion';
import { FaServer, FaUsers } from 'react-icons/fa';

export default function ServerSelector({ guilds, loading, selected, onSelect }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-cult-500/30 border-t-cult-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="section-title flex items-center gap-3">
        <FaServer className="text-cult-400" />
        Select a Server
      </h2>
      <p className="text-white/40 mb-8 -mt-4">
        Choose a server to manage. Only servers where you are an admin and the bot is present are shown.
      </p>

      {guilds.length === 0 ? (
        <div className="glass p-12 text-center">
          <FaServer className="text-5xl text-white/10 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No manageable servers found.</p>
          <p className="text-white/20 text-sm mt-2">
            Make sure you have admin permission and the bot is in your server.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guilds.map((guild, i) => (
            <motion.button
              key={guild.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(guild)}
              className={`glass glass-hover p-6 text-left group ${
                selected?.id === guild.id
                  ? 'border-cult-500/50 bg-cult-500/10'
                  : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {guild.icon ? (
                  <img
                    src={guild.icon}
                    alt={guild.name}
                    className="w-14 h-14 rounded-xl ring-2 ring-white/10 group-hover:ring-cult-500/30 transition-all"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cult-600 to-cult-800 flex items-center justify-center text-xl font-bold text-white">
                    {guild.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate group-hover:text-cult-300 transition-colors">
                    {guild.name}
                  </h3>
                  <p className="text-white/30 text-xs mt-1">ID: {guild.id}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
