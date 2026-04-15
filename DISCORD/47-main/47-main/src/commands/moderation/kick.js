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
        const member = await interaction.guild.members.fetch(user.id);

        if (!member.kickable) {
            return interaction.reply({ content: 'I cannot kick this user!', ephemeral: true });
        }

        await member.kick(reason);
        
        const embed = new EmbedBuilder()
            .setTitle('Member Kicked')
            .setDescription(`${user.tag} has been kicked for: ${reason}`)
            .setColor('#FFA500')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
