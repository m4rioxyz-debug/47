const { Events, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');

const verificationCooldowns = new Set();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }

        if (interaction.isButton()) {
            const { config } = client;
            const { readDb, writeDb } = require('../../utils/db');
            const db = readDb();

            if (interaction.customId.startsWith('ticket_')) {
                // Anti-Spam / Cooldown Check
                const existingTicket = Object.values(db.tickets).find(t => t.userId === interaction.user.id && t.status === 'open');
                if (existingTicket) {
                    return interaction.reply({ content: '❌ You already have an open ticket!', ephemeral: true });
                }

                const type = interaction.customId.split('_')[1];
                const modal = new ModalBuilder()
                    .setCustomId(`modal_ticket_${type}`)
                    .setTitle(`Submit: ${type.charAt(0).toUpperCase() + type.slice(1)}`);

                const reasonInput = new TextInputBuilder()
                    .setCustomId('ticket_reason')
                    .setLabel("Details/Reason")
                    .setPlaceholder("Please describe your request in detail...")
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
                await interaction.showModal(modal);
            }

            if (interaction.customId === 'claim_ticket') {
                const staffRoleId = config.roles.staffRole;
                if (!interaction.member.roles.cache.has(staffRoleId)) {
                    return interaction.reply({ content: 'Only staff can claim tickets!', ephemeral: true });
                }

                const embed = EmbedBuilder.from(interaction.message.embeds[0])
                    .addFields({ name: '🛡️ Handled By', value: `${interaction.user} (Claimed)` });
                
                const claimedRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Secondary).setEmoji('🔒'),
                    new ButtonBuilder().setCustomId('delete_ticket').setLabel('Delete').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
                );

                await interaction.update({ embeds: [embed], components: [claimedRow] });
            }

            if (interaction.customId === 'close_ticket') {
                const transcript = await discordTranscripts.createTranscript(interaction.channel);
                if (config.channels.logs) {
                    const logsChannel = interaction.guild.channels.cache.get(config.channels.logs);
                    if (logsChannel) {
                        logsChannel.send({
                            content: `📄 Transcript for ticket: **${interaction.channel.name}**\nUser: <@${interaction.channel.topic}>`,
                            files: [transcript]
                        });
                    }
                }

                await interaction.reply('🛡️ **Ticket Closed.** Transcripts sent to logs. Channel will be deleted shortly.');
                setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
                
                // Update DB status
                const ticketKey = Object.keys(db.tickets).find(k => db.tickets[k].channelId === interaction.channelId);
                if (ticketKey) {
                    db.tickets[ticketKey].status = 'closed';
                    writeDb(db);
                }
            }

            if (interaction.customId === 'delete_ticket') {
                await interaction.reply('🗑️ Deleting channel...');
                setTimeout(() => interaction.channel.delete().catch(() => {}), 1000);
            }

            // ─── Verification Button Handler ───
            if (interaction.customId === 'verify_user') {
                // Cooldown Check
                if (verificationCooldowns.has(interaction.user.id)) {
                    return interaction.reply({ content: '⏳ Please wait a few seconds before trying again.', ephemeral: true });
                }

                // Check if already verified (using ID: 1489742765838438401)
                const verifiedRoleID = '1489742765838438401';
                if (interaction.member.roles.cache.has(verifiedRoleID)) {
                    return interaction.reply({ content: '✅ You are already verified!', ephemeral: true });
                }

                // Show Modal
                const modal = new ModalBuilder()
                    .setCustomId('modal_verify')
                    .setTitle('Verification');

                const input = new TextInputBuilder()
                    .setCustomId('verify_word')
                    .setLabel("Type the verification word")
                    .setPlaceholder("Enter: verifself")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);

                // Add to cooldown
                verificationCooldowns.add(interaction.user.id);
                setTimeout(() => verificationCooldowns.delete(interaction.user.id), 5000);
            }
        }

        if (interaction.isModalSubmit()) {
            const { readDb, writeDb } = require('../../utils/db');
            
            try {
                // ─── Ticket Modal Handler ───
                if (interaction.customId.startsWith('modal_ticket_')) {
                    const type = interaction.customId.split('_')[2] || 'support';
                    const reason = interaction.fields.getTextInputValue('ticket_reason');
                    const { config } = client;
                    
                    if (!config || !config.roles || !config.roles.staffRole) {
                        return interaction.reply({ content: '❌ Configuration error: staffRole not found in config.json.', ephemeral: true });
                    }

                    // Check if category exists, else use null
                    let parentId = null;
                    if (config.channels && config.channels.ticketsCategory) {
                        const category = interaction.guild.channels.cache.get(config.channels.ticketsCategory);
                        if (category && category.type === ChannelType.GuildCategory) {
                             parentId = category.id;
                        }
                    }

                    const channel = await interaction.guild.channels.create({
                        name: `${type}-${interaction.user.username}`.slice(0, 100),
                        type: ChannelType.GuildText,
                        parent: parentId,
                        topic: interaction.user.id,
                        permissionOverwrites: [
                            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                            { id: config.roles.staffRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                        ],
                    });

                    const embed = new EmbedBuilder()
                        .setTitle(`Ticket: ${type.toUpperCase()}`)
                        .setDescription(`**User:** ${interaction.user}\n**Reason:** ${reason}`)
                        .setColor('#2F3136')
                        .setThumbnail(interaction.user.displayAvatarURL())
                        .setTimestamp();

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim Ticket').setStyle(ButtonStyle.Primary).setEmoji('👋'),
                        new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Secondary).setEmoji('🔒')
                    );

                    await channel.send({ 
                        content: `<@&${config.roles.staffRole}> | ${interaction.user}`, 
                        embeds: [embed], 
                        components: [row] 
                    });
                    
                    // Save to DB
                    const db = readDb();
                    if (!db.tickets) db.tickets = {};
                    db.tickets[channel.id] = { userId: interaction.user.id, channelId: channel.id, status: 'open' };
                    writeDb(db);

                    await interaction.reply({ content: `✅ Your ticket has been created: ${channel}`, ephemeral: true });
                }

                // ─── Verification Modal Handler ───
                else if (interaction.customId === 'modal_verify') {
                    const input = interaction.fields.getTextInputValue('verify_word');

                    if (input === 'verifself') {
                        const verifiedRoleID = '1489742765838438401';
                        const verifiedRole = interaction.guild.roles.cache.get(verifiedRoleID);
                        
                        if (!verifiedRole) {
                            return interaction.reply({ content: '❌ Error: Verified role not found on this server. Please contact an admin.', ephemeral: true });
                        }

                        await interaction.member.roles.add(verifiedRole);
                        console.log(`[VERIFY] ${interaction.user.tag} verified successfully.`);
                        
                        await interaction.reply({ content: '✅ You are verified!', ephemeral: true });

                        // Log to channel if config exists
                        const { config } = client;
                        if (config && config.channels && config.channels.logs) {
                            const logChannel = interaction.guild.channels.cache.get(config.channels.logs);
                            if (logChannel) {
                                logChannel.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor('#2ECC71')
                                            .setTitle('Member Verified')
                                            .setDescription(`**User:** ${interaction.user.tag}\n**ID:** ${interaction.user.id}\n**Method:** Button (verifself)`)
                                            .setTimestamp()
                                    ]
                                });
                            }
                        }
                    } else {
                        await interaction.reply({ content: '❌ Incorrect verification word', ephemeral: true });
                    }
                }
            } catch (error) {
                console.error('[MODAL ERROR] Processing failed:', error);
                
                // Fallback reply if something goes wrong
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: `❌ **An error occurred:** ${error.message}`, 
                        ephemeral: true 
                    }).catch(() => {});
                }
            }
        }
    },
};
