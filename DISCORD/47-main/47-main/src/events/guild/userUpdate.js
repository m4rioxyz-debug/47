const { Events } = require('discord.js');

module.exports = {
    name: Events.UserUpdate,
    async execute(oldUser, newUser, client) {
        if (oldUser.username === newUser.username) return;

        const prefix = "47 | ";
        const guilds = client.guilds.cache;

        for (const guild of guilds.values()) {
            try {
                const member = await guild.members.fetch(newUser.id).catch(() => null);
                if (!member) continue;

                // Safety checks
                if (member.id === guild.ownerId) continue;
                if (member.roles.highest.position >= guild.members.me.roles.highest.position) continue;

                // Smart Check: Already tagged or matches
                if (member.displayName.startsWith('47 ')) continue;

                const expectedNickname = `47 ${member.displayName}`.substring(0, 32);
                await member.setNickname(expectedNickname);
                console.log(`[Sync] Automatically updated nickname for ${newUser.tag} to: ${expectedNickname}`);
            } catch (error) {
                // Handle errors silently
            }
        }
    },
};
