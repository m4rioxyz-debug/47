const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember, client) {
        // Detect server boosters
        const wasBoosting = oldMember.premiumSince;
        const isBoosting = newMember.premiumSince;

        if (!wasBoosting && isBoosting) {
            // Member just started boosting
            const { config } = client;
            
            // Give special role
            if (config.roles.boosterRole) {
                const role = newMember.guild.roles.cache.get(config.roles.boosterRole);
                if (role) {
                    newMember.roles.add(role).catch(console.error);
                }
            }

            // Send thank you message in logs or a specific channel
            if (config.channels.welcome) {
                const channel = newMember.guild.channels.cache.get(config.channels.welcome);
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setTitle('🚀 New Server Booster!')
                        .setDescription(`Thank you ${newMember} for boosting the server! You've been given your perks.`)
                        .setColor('#F47FFF')
                        .setTimestamp();
                    channel.send({ embeds: [embed] });
                }
            }
        }
    },
};
