const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option => option.setName('target').setDescription('The member to ban').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('The reason for the ban'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        await interaction.deferReply({ ephemeral: true });

        try {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);

            // Note: You can ban users who are not in the server, but member.bannable requires a GuildMember object.
            // If we want to ban someone not in the server, we use interaction.guild.bans.create(user.id, { reason })
            if (member && !member.bannable) {
                return interaction.editReply({ content: '❌ I cannot ban this user! They might have a higher role than me or I lack the necessary permissions.' });
            }

            await interaction.guild.bans.create(user.id, { reason });
            
            const embed = new EmbedBuilder()
                .setTitle('Member Banned')
                .setDescription(`${user} has been banned.\n**Reason:** ${reason}`)
                .setColor('#FF0000')
                .setTimestamp()
                .setFooter({ text: `Banned by ${interaction.user.tag}` });

            await interaction.editReply({ embeds: [embed] });

            // ─── Logging ──────────────────────────────────────────
            const { config } = interaction.client;
            if (config && config.channels && config.channels.logs) {
                const logChannel = interaction.guild.channels.cache.get(config.channels.logs);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Member Banned')
                        .setColor('#FF0000')
                        .setThumbnail(user.displayAvatarURL())
                        .addFields(
                            { name: '👤 Target', value: `${user.tag} (${user.id})`, inline: true },
                            { name: '🛡️ Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                            { name: '📝 Reason', value: reason }
                        )
                        .setTimestamp();
                    
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (error) {
            console.error('[BAN ERROR]:', error);
            await interaction.editReply({ content: `❌ An error occurred while trying to ban this user: ${error.message}` });
        }
    },
};
