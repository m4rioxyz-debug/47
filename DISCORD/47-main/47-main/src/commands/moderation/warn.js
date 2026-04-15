const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readDb, writeDb } = require('../../utils/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member')
        .addUserOption(option => option.setName('target').setDescription('The member to warn').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('The reason for the warning').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');
        
        const db = readDb();
        if (!db.warns[user.id]) db.warns[user.id] = [];
        
        db.warns[user.id].push({
            reason,
            moderator: interaction.user.id,
            timestamp: Date.now()
        });
        
        writeDb(db);

        let extraAction = '';
        if (db.warns[user.id].length >= 3) {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if (member && member.moderatable) {
                await member.timeout(10 * 60 * 1000, '3 Warnings Reached');
                extraAction = '\n\n🚨 **User has been timed out for 10 minutes (3 Warns reached)!**';
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Member Warned')
            .setDescription(`${user.tag} has been warned for: ${reason}\nTotal warns: ${db.warns[user.id].length}${extraAction}`)
            .setColor('#FFFF00')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
