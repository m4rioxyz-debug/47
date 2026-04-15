const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify-setup')
        .setDescription('Setup the verification room')
        .addChannelOption(option => option.setName('channel').setDescription('The channel to send the verify panel to').setRequired(true).addChannelTypes(ChannelType.GuildText))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Account Verification')
            .setDescription('To access the full server, please click the button below and follow the instructions.')
            .setColor('#2F3136')
            .setFooter({ text: 'Powered by 47 Security' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_user')
                    .setLabel('Verify')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🛡️')
            );

        await channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Verification setup complete!', ephemeral: true });
    },
};
