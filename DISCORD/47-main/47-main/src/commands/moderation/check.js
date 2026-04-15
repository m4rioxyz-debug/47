const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readDb } = require('../../utils/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check')
        .setDescription('Check a user\'s warns, bans, and timeout status')
        .addUserOption(option => option.setName('target').setDescription('The user to check').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        const db = readDb();
        
        const warns = db.warns[user.id] || [];
        const warnList = warns.length > 0 ? warns.map((w, i) => `${i + 1}. **${w.reason}** (By <@${w.moderator}>)`).join('\n') : "No warnings.";

        // Check if banned
        let isBanned = false;
        try {
            await interaction.guild.bans.fetch(user.id);
            isBanned = true;
        } catch (err) {
            isBanned = false;
        }

        const embed = new EmbedBuilder()
            .setTitle(`User Check: ${user.tag}`)
            .setColor('#2F3136')
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: '👤 User', value: `${user} (${user.id})`, inline: true },
                { name: '🚫 Banned', value: isBanned ? "✅ Yes" : "❌ No", inline: true },
                { name: '⏳ Timeout', value: member?.communicationDisabledUntil ? `<t:${Math.floor(member.communicationDisabledUntilTimestamp / 1000)}:R>` : "❌ None", inline: true },
                { name: '⚠️ Warnings', value: `Total: ${warns.length}\n${warnList}` }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
