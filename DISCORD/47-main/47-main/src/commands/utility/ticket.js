const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('Setup the ticket system')
        .addChannelOption(option => option.setName('channel').setDescription('The channel to send the ticket panel to').setRequired(true).addChannelTypes(ChannelType.GuildText))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Support Center')
            .setDescription('Select the most relevant category to open a ticket.\n\n' +
                '🎮 **Join Team** - Interest in joining our roster\n' +
                '🛠️ **Support** - General help or questions\n' +
                '📩 **Report Issue** - Bugs or player reports\n' +
                '💼 **Staff Application** - Interested in joining the team staff')
            .setColor('#2F3136')
            .setFooter({ text: 'Powered by 47 • Professional Support System' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('ticket_team').setLabel('Join Team').setStyle(ButtonStyle.Primary).setEmoji('🎮'),
                new ButtonBuilder().setCustomId('ticket_support').setLabel('Support').setStyle(ButtonStyle.Secondary).setEmoji('🛠️'),
                new ButtonBuilder().setCustomId('ticket_report').setLabel('Report Issue').setStyle(ButtonStyle.Danger).setEmoji('📩'),
                new ButtonBuilder().setCustomId('ticket_apply').setLabel('Staff App').setStyle(ButtonStyle.Success).setEmoji('💼'),
            );

        await channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Professional Ticket system setup complete!', ephemeral: true });
    },
};
