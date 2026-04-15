const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        const { config } = client;
        
        // Auto Role
        if (config.roles.autoRole) {
            const role = member.guild.roles.cache.get(config.roles.autoRole);
            if (role) {
                member.roles.add(role).catch(console.error);
            }
        }

        // Auto Nickname
        if (!member.displayName.startsWith('47 ')) {
            const newName = `47 ${member.displayName}`.substring(0, 32);
            member.setNickname(newName).catch(() => {});
        }

        // Welcome Message
        if (config.channels.welcome) {
            const channel = member.guild.channels.cache.get(config.channels.welcome);
            if (channel) {
                const embed = new EmbedBuilder()
                    .setTitle('Welcome!')
                    .setDescription(`Welcome ${member} to the server! We are glad to have you here.`)
                    .setColor('#00FF00')
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp();
                channel.send({ embeds: [embed] });
            }
        }
    },
};
