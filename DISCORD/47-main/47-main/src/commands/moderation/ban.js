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
        const member = await interaction.guild.members.fetch(user.id);

        if (!member.bannable) {
            return interaction.reply({ content: 'I cannot ban this user!', ephemeral: true });
        }

        await member.ban({ reason });
        
        const embed = new EmbedBuilder()
            .setTitle('Member Banned')
            .setDescription(`${user.tag} has been banned for: ${reason}`)
            .setColor('#FF0000')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
