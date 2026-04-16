const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete a specified number of messages')
        .addIntegerOption(option => option.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        
        try {
            const messages = await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ content: `✅ Successfully deleted ${messages.size} messages.`, ephemeral: true });
        } catch (error) {
            console.error('[CLEAR ERROR]:', error);
            await interaction.reply({ content: `❌ Failed to delete messages: ${error.message}`, ephemeral: true });
        }
    },
};
