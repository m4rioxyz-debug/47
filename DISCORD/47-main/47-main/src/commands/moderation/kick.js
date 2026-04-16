const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option => option.setName('target').setDescription('The member to kick').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('The reason for the kick'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';
        
        await interaction.deferReply({ ephemeral: true });

        try {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);

            if (!member) {
                return interaction.editReply({ content: '❌ This user is not in the server.' });
            }

            if (!member.kickable) {
                return interaction.editReply({ content: '❌ I cannot kick this user! They might have a higher role than me or I lack the necessary permissions.' });
            }

            await member.kick(reason);
            
            const embed = new EmbedBuilder()
                .setTitle('Member Kicked')
                .setDescription(`${user} has been kicked.\n**Reason:** ${reason}`)
                .setColor('#FFA500')
                .setTimestamp()
                .setFooter({ text: `Kicked by ${interaction.user.tag}` });

            await interaction.editReply({ embeds: [embed] });

            // ─── Logging ──────────────────────────────────────────
            const { config } = interaction.client;
            if (config && config.channels && config.channels.logs) {
                const logChannel = interaction.guild.channels.cache.get(config.channels.logs);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Member Kicked')
                        .setColor('#FFA500')
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
            console.error('[KICK ERROR]:', error);
            await interaction.editReply({ content: `❌ An error occurred while trying to kick this user: ${error.message}` });
        }
    },
};
