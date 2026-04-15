const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mass-nickname')
        .setDescription('Smartly update all server members to "47 displayName" format')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.reply({ content: 'Starting smart nickname update... This may take a while.', ephemeral: true });

        const members = await interaction.guild.members.fetch();
        let changed = 0;
        let skipped = 0;
        let failed = 0;

        for (const member of members.values()) {
            if (member.id === interaction.guild.ownerId) continue;
            
            // Smart Check: Already tagged?
            if (member.displayName.startsWith('47 ')) {
                skipped++;
                continue;
            }

            // Safety: Highest role check
            if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                failed++;
                continue;
            }

            try {
                const newNickname = `47 ${member.displayName}`.substring(0, 32);
                await member.setNickname(newNickname);
                changed++;
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                failed++;
            }
        }

        await interaction.editReply({ content: `Smart Sync complete!\n✅ Changed: ${changed}\n⏩ Skipped (Already tagged): ${skipped}\n❌ Failed (Permissions): ${failed}` });
    },
};
