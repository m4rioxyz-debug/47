const { Events, AuditLogEvent, EmbedBuilder } = require('discord.js');
const { readDb, writeDb } = require('../../utils/db');

module.exports = {
    name: Events.ChannelDelete,
    async execute(channel, client) {
        if (!client.config.antiNuke.enabled) return;

        const auditLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
        const entry = auditLogs.entries.first();
        if (!entry) return;

        const executor = entry.executor;
        if (client.config.botAdmins.includes(executor.id)) return;

        // Anti-Nuke Logic
        handleAction(executor, channel.guild, client, 'Channel Delete');
    },
};

async function handleAction(user, guild, client, actionType) {
    const db = readDb();
    const userId = user.id;
    const now = Date.now();
    const config = client.config.antiNuke;

    if (!db.antiNuke[userId]) db.antiNuke[userId] = [];
    db.antiNuke[userId] = db.antiNuke[userId].filter(timestamp => now - timestamp < config.timeWindowMs);
    db.antiNuke[userId].push(now);
    writeDb(db);

    if (db.antiNuke[userId].length >= config.maxActionsBeforePunish) {
        // Punish
        const member = await guild.members.fetch(userId).catch(() => null);
        if (member) {
            if (config.punishment === 'ban') {
                await member.ban({ reason: `Anti-Nuke Triggered: ${actionType} spam` }).catch(console.error);
            } else {
                await member.kick(`Anti-Nuke Triggered: ${actionType} spam`).catch(console.error);
            }

            // Log it
            if (client.config.channels.logs) {
                const logsChannel = guild.channels.cache.get(client.config.channels.logs);
                if (logsChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('🚨 Anti-Nuke Triggered')
                        .setDescription(`**User:** ${user.tag} (${user.id})\n**Action:** ${actionType}\n**Punishment:** ${config.punishment}`)
                        .setColor('#FF0000')
                        .setTimestamp();
                    logsChannel.send({ embeds: [embed] });
                }
            }
        }
    }
}

// In a real bot, we'd add similar exports for Events.RoleDelete, Events.GuildBanAdd, etc.
// For brevity, I'll put them in the same file or mention they follow the same pattern.
