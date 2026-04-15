// =====================================================================
//  47 CULT Bot — CW47
//  A discord.js v14 bot that rebuilds a 47 CULT themed server
//  with custom channels, roles, and automatic role assignment.
// =====================================================================

require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require('discord.js');

// ─── Validate Environment ─────────────────────────────────────────
const { DISCORD_TOKEN } = process.env;
if (!DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is missing. Copy .env.example → .env and add your token.');
  process.exit(1);
}

// ─── Create Client ────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,   // Needed for auto-role on join
    GatewayIntentBits.GuildMessages,
  ],
});

// ─── Role Definitions ─────────────────────────────────────────────
// Each role has a name, hex color, and a set of permission flags.
// Roles are created in order — highest authority first (top of role list).
const ROLE_DEFINITIONS = [
  {
    name: 'High Priest 47',
    color: '#9B59B6',   // Royal purple
    permissions: [PermissionFlagsBits.Administrator],
    hoist: true,        // Show separately in member list
    mentionable: true,
  },
  {
    name: 'Acolyte 47',
    color: '#8E44AD',   // Deep violet
    permissions: [PermissionFlagsBits.Administrator],
    hoist: true,
    mentionable: true,
  },
  {
    name: 'Enforcer 47',
    color: '#E74C3C',   // Crimson red
    permissions: [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.MuteMembers,
      PermissionFlagsBits.DeafenMembers,
      PermissionFlagsBits.MoveMembers,
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak,
    ],
    hoist: true,
    mentionable: true,
  },
  {
    name: 'Disciple 47',
    color: '#E67E22',   // Amber
    permissions: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.AddReactions,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak,
      PermissionFlagsBits.UseVAD,
    ],
    hoist: true,
    mentionable: false,
  },
  {
    name: 'Novice 47',
    color: '#3498DB',   // Steel blue
    permissions: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.AddReactions,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak,
    ],
    hoist: true,
    mentionable: false,
  },
  {
    name: 'Follower 47',
    color: '#95A5A6',   // Grey — entry-level
    permissions: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.AddReactions,
    ],
    hoist: false,
    mentionable: false,
    autoAssign: true,   // Flag: assign to new members automatically
  },
];

// ─── Channel Definitions ──────────────────────────────────────────
// Organized into categories. Each channel has:
//   name, emoji-prefixed display name, topic, and access rules.
// Access tiers:
//   "public"   → Disciple 47+ and Follower 47 can view
//   "novice"   → Novice 47+ can view (Follower excluded)
//   "staff"    → Enforcer 47+ only
//   "admin"    → High Priest 47 and Acolyte 47 only
const CHANNEL_LAYOUT = [
  {
    category: '☽ 47 CULT ☾',
    channels: [
      {
        name: '🏛️・sanctum',
        type: ChannelType.GuildText,
        topic: '📖 The sacred hall of law. Read the rules before you proceed.',
        access: 'public',
        readOnly: true,  // Everyone can read, only staff can write
      },
      {
        name: '📜・codex',
        type: ChannelType.GuildText,
        topic: '⚖️ The Codex of the Cult. Guidelines that bind us all.',
        access: 'public',
        readOnly: true,
      },
    ],
  },
  {
    category: '🔓 GATEWAY',
    channels: [
      {
        name: '🔑・gateway',
        type: ChannelType.GuildText,
        topic: '🚪 Prove your allegiance. Verification happens here.',
        access: 'public',
      },
      {
        name: '✍️・initiate',
        type: ChannelType.GuildText,
        topic: '📝 Submit your application to join the ranks.',
        access: 'public',
      },
      {
        name: '📊・ledger',
        type: ChannelType.GuildText,
        topic: '📋 Track ongoing tryouts and recruitment progress.',
        access: 'staff',
      },
    ],
  },
  {
    category: '💬 COMMUNE',
    channels: [
      {
        name: '💬・conclave',
        type: ChannelType.GuildText,
        topic: '🗣️ Speak freely among the faithful.',
        access: 'public',
      },
      {
        name: '😂・echoes',
        type: ChannelType.GuildText,
        topic: '🎭 Memes, jokes, and echoes of laughter.',
        access: 'public',
      },
      {
        name: '📸・vision',
        type: ChannelType.GuildText,
        topic: '📷 Share media, screenshots, and visions.',
        access: 'public',
      },
      {
        name: '🎵・chants',
        type: ChannelType.GuildText,
        topic: '🎶 Music, ambient sounds, and cult chants.',
        access: 'public',
      },
    ],
  },
  {
    category: '🔥 INNER SANCTUM',
    channels: [
      {
        name: '🔥・inner-circle',
        type: ChannelType.GuildText,
        topic: '🛡️ For the chosen few. Team-only discussions.',
        access: 'staff',
      },
      {
        name: '📋・war-room',
        type: ChannelType.GuildText,
        topic: '⚔️ Strategy and operations. Staff only.',
        access: 'admin',
      },
    ],
  },
  {
    category: '🔊 VOICE CHAMBERS',
    channels: [
      {
        name: '🎙️・ritual-hall',
        type: ChannelType.GuildVoice,
        topic: null,
        access: 'public',
      },
      {
        name: '🔒・council-chamber',
        type: ChannelType.GuildVoice,
        topic: null,
        access: 'staff',
      },
    ],
  },
];

// ─── Helper: Compute combined permission bigint ───────────────────
function combinePermissions(permArray) {
  return permArray.reduce((acc, perm) => acc | perm, 0n);
}

// ─── Helper: Build channel permission overwrites ──────────────────
// Returns an array of permission overwrite objects for a channel
// based on its access tier and whether it's read-only.
function buildOverwrites(guild, roleMap, access, readOnly = false) {
  const everyone = guild.roles.everyone;
  const overwrites = [];

  // Deny @everyone by default — channels are private unless explicitly allowed
  overwrites.push({
    id: everyone.id,
    deny: [PermissionFlagsBits.ViewChannel],
  });

  // Admin roles always have full access
  const adminRoles = ['High Priest 47', 'Acolyte 47'];
  for (const name of adminRoles) {
    if (roleMap.has(name)) {
      overwrites.push({
        id: roleMap.get(name).id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak,
          PermissionFlagsBits.MoveMembers,
        ],
      });
    }
  }

  // Enforcer — always has access if the channel is staff+
  if (roleMap.has('Enforcer 47')) {
    if (['staff', 'public', 'novice'].includes(access)) {
      overwrites.push({
        id: roleMap.get('Enforcer 47').id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak,
        ],
      });
    }
  }

  // Disciple — public and novice channels
  if (['public', 'novice'].includes(access) && roleMap.has('Disciple 47')) {
    const allow = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak];
    const deny = [];
    if (readOnly) {
      deny.push(PermissionFlagsBits.SendMessages);
    } else {
      allow.push(PermissionFlagsBits.SendMessages);
    }
    overwrites.push({ id: roleMap.get('Disciple 47').id, allow, deny });
  }

  // Novice — public and novice channels
  if (['public', 'novice'].includes(access) && roleMap.has('Novice 47')) {
    const allow = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak];
    const deny = [];
    if (readOnly) {
      deny.push(PermissionFlagsBits.SendMessages);
    } else {
      allow.push(PermissionFlagsBits.SendMessages);
    }
    overwrites.push({ id: roleMap.get('Novice 47').id, allow, deny });
  }

  // Follower — public channels only
  if (access === 'public' && roleMap.has('Follower 47')) {
    const allow = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak];
    const deny = [];
    if (readOnly) {
      deny.push(PermissionFlagsBits.SendMessages);
    } else {
      allow.push(PermissionFlagsBits.SendMessages);
    }
    overwrites.push({ id: roleMap.get('Follower 47').id, allow, deny });
  }

  return overwrites;
}

// =====================================================================
//  EVENT: Ready — Bot has connected
// =====================================================================
client.once('ready', () => {
  console.log('');
  console.log('══════════════════════════════════════════');
  console.log('  ☽  47 CULT BOT — ONLINE  ☾');
  console.log(`  Logged in as: ${client.user.tag}`);
  console.log(`  Serving ${client.guilds.cache.size} guild(s)`);
  console.log('══════════════════════════════════════════');
  console.log('');
});

// =====================================================================
//  EVENT: GuildMemberAdd — Auto-assign Follower 47 role
// =====================================================================
client.on('guildMemberAdd', async (member) => {
  try {
    // Find the Follower 47 role in this guild
    const followerRole = member.guild.roles.cache.find(r => r.name === 'Follower 47');
    if (followerRole) {
      await member.roles.add(followerRole);
      console.log(`✅ Auto-assigned "Follower 47" to ${member.user.tag}`);
    } else {
      console.warn(`⚠️  "Follower 47" role not found in ${member.guild.name}. Run /CW47 first.`);
    }
  } catch (err) {
    console.error(`❌ Failed to assign role to ${member.user.tag}:`, err.message);
  }
});

// =====================================================================
//  EVENT: InteractionCreate — Handle /CW47 command
// =====================================================================
client.on('interactionCreate', async (interaction) => {
  // Only handle slash commands
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'cw47') return;

  // ── Permission guard: require Administrator ──
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '🚫 Only those with **Administrator** power may invoke the ritual.',
      ephemeral: true,
    });
  }

  const guild = interaction.guild;
  console.log(`\n🔥 /CW47 invoked by ${interaction.user.tag} in "${guild.name}"`);

  // Defer the reply — this operation takes a while
  await interaction.deferReply({ ephemeral: true });

  try {
    // ════════════════════════════════════════════════
    //  PHASE 1: Create / Verify Roles
    // ════════════════════════════════════════════════
    console.log('\n── Phase 1: Roles ──');
    const roleMap = new Map(); // name → Role object

    // Fetch all current roles
    await guild.roles.fetch();

    // Get the bot's highest role position for ordering
    const botMember = await guild.members.fetch(client.user.id);
    const botHighestRole = botMember.roles.highest;

    for (let i = 0; i < ROLE_DEFINITIONS.length; i++) {
      const def = ROLE_DEFINITIONS[i];
      let role = guild.roles.cache.find(r => r.name === def.name);

      if (role) {
        // Role exists — update it to match our definition
        console.log(`  ♻️  Updating existing role: ${def.name}`);
        role = await role.edit({
          color: def.color,
          permissions: combinePermissions(def.permissions),
          hoist: def.hoist,
          mentionable: def.mentionable,
          reason: 'CW47 — 47 CULT restructure',
        });
      } else {
        // Create the role
        console.log(`  ✨ Creating role: ${def.name}`);
        role = await guild.roles.create({
          name: def.name,
          color: def.color,
          permissions: combinePermissions(def.permissions),
          hoist: def.hoist,
          mentionable: def.mentionable,
          reason: 'CW47 — 47 CULT restructure',
        });
      }

      roleMap.set(def.name, role);
    }

    // Reorder roles so that High Priest is highest
    // Position them just below the bot's role
    try {
      const positions = [];
      const totalRoles = ROLE_DEFINITIONS.length;
      for (let i = 0; i < totalRoles; i++) {
        const def = ROLE_DEFINITIONS[i];
        const role = roleMap.get(def.name);
        // Top role gets highest position, descending
        positions.push({
          role: role.id,
          position: Math.max(1, botHighestRole.position - 1 - i),
        });
      }
      await guild.roles.setPositions(positions);
      console.log('  📊 Role hierarchy sorted.');
    } catch (posErr) {
      console.warn('  ⚠️  Could not sort role positions (bot may need higher role):', posErr.message);
    }

    console.log(`  ✅ ${roleMap.size} roles ready.`);

    // ════════════════════════════════════════════════
    //  PHASE 2: Delete ALL existing channels
    // ════════════════════════════════════════════════
    console.log('\n── Phase 2: Purge Channels ──');
    const existingChannels = guild.channels.cache;
    let deleted = 0;

    for (const [, channel] of existingChannels) {
      try {
        await channel.delete('CW47 — Full server reset');
        deleted++;
      } catch (err) {
        console.warn(`  ⚠️  Could not delete channel "${channel.name}": ${err.message}`);
      }
    }
    console.log(`  🗑️  Deleted ${deleted} channel(s).`);

    // ════════════════════════════════════════════════
    //  PHASE 3: Rebuild channel structure
    // ════════════════════════════════════════════════
    console.log('\n── Phase 3: Rebuild Channels ──');
    let createdCount = 0;

    // Keep a reference to the sanctum channel for the welcome embed
    let sanctumChannel = null;

    for (const section of CHANNEL_LAYOUT) {
      // Create the category
      console.log(`  📁 Category: ${section.category}`);
      const category = await guild.channels.create({
        name: section.category,
        type: ChannelType.GuildCategory,
        reason: 'CW47 — 47 CULT restructure',
      });

      // Create each channel inside the category
      for (const chDef of section.channels) {
        const overwrites = buildOverwrites(guild, roleMap, chDef.access, chDef.readOnly);

        const channelOptions = {
          name: chDef.name,
          type: chDef.type,
          parent: category.id,
          permissionOverwrites: overwrites,
          reason: 'CW47 — 47 CULT restructure',
        };

        // Add topic for text channels
        if (chDef.topic && chDef.type === ChannelType.GuildText) {
          channelOptions.topic = chDef.topic;
        }

        const newChannel = await guild.channels.create(channelOptions);
        createdCount++;
        console.log(`    ➕ ${chDef.type === ChannelType.GuildVoice ? '🔊' : '💬'} ${chDef.name}`);

        // Save reference to sanctum for the welcome message
        if (chDef.name.includes('sanctum')) {
          sanctumChannel = newChannel;
        }
      }
    }
    console.log(`  ✅ Created ${createdCount} channel(s) across ${CHANNEL_LAYOUT.length} categories.`);

    // ════════════════════════════════════════════════
    //  PHASE 4: Post welcome embed in sanctum
    // ════════════════════════════════════════════════
    if (sanctumChannel) {
      console.log('\n── Phase 4: Welcome Embed ──');

      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('☽ Welcome to the 47 CULT ☾')
        .setDescription(
          '**You have entered the sanctum.**\n\n' +
          'This is a place of order and devotion. Read the rules below, ' +
          'conduct yourself with discipline, and prove your worth.\n\n' +
          '───────────────────────────'
        )
        .addFields(
          {
            name: '📜 I. Respect the Hierarchy',
            value: 'The word of the **High Priest** is absolute. Obey the chain of command.',
            inline: false,
          },
          {
            name: '🤐 II. No Leaking',
            value: 'What happens in the cult, stays in the cult. Breaches are met with exile.',
            inline: false,
          },
          {
            name: '⚔️ III. No Toxicity',
            value: 'Engage with honor. Racism, sexism, and personal attacks are forbidden.',
            inline: false,
          },
          {
            name: '🎮 IV. Stay Active',
            value: 'Inactive members may be purged. Show your devotion regularly.',
            inline: false,
          },
          {
            name: '🔥 V. Prove Your Worth',
            value: 'Submit an application in ✍️・initiate to advance beyond Follower.',
            inline: false,
          },
          {
            name: '\u200B',
            value: '───────────────────────────\n' +
              '**Role Hierarchy:**\n' +
              '👑 `High Priest 47` — Supreme authority\n' +
              '🔮 `Acolyte 47` — Co-leader\n' +
              '⚔️ `Enforcer 47` — Moderation & order\n' +
              '🗡️ `Disciple 47` — Proven member\n' +
              '📖 `Novice 47` — In training\n' +
              '👤 `Follower 47` — New arrival',
            inline: false,
          }
        )
        .setFooter({ text: '47 CULT • CW47' })
        .setTimestamp();

      await sanctumChannel.send({ embeds: [welcomeEmbed] });
      console.log('  📨 Welcome embed posted in sanctum.');
    }

    // ════════════════════════════════════════════════
    //  PHASE 5: Confirmation
    // ════════════════════════════════════════════════
    console.log('\n══════════════════════════════════════════');
    console.log('  ✅ CW47 RITUAL COMPLETE');
    console.log('══════════════════════════════════════════\n');

    // Try to respond — the original interaction channel was deleted,
    // so we send a followUp which may fail. We handle that gracefully.
    try {
      await interaction.editReply({
        content:
          '✅ **CW47 Ritual Complete.**\n\n' +
          `🔮 **${roleMap.size}** roles configured\n` +
          `📁 **${createdCount}** channels created\n` +
          `🗑️ **${deleted}** old channels purged\n\n` +
          '☽ The 47 CULT server has been reborn. ☾',
      });
    } catch {
      // Expected — the channel where the command was used has been deleted
      console.log('  ℹ️  Could not send reply (original channel was deleted). This is expected.');

      // Post a confirmation in the first available text channel instead
      const fallbackChannel = guild.channels.cache.find(
        c => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
      );
      if (fallbackChannel) {
        const confirmEmbed = new EmbedBuilder()
          .setColor(0x2ECC71)
          .setTitle('✅ CW47 Ritual Complete')
          .setDescription(
            `🔮 **${roleMap.size}** roles configured\n` +
            `📁 **${createdCount}** channels created\n` +
            `🗑️ **${deleted}** old channels purged\n\n` +
            `Ritual performed by <@${interaction.user.id}>.`
          )
          .setTimestamp();
        await fallbackChannel.send({ embeds: [confirmEmbed] });
      }
    }

  } catch (error) {
    console.error('❌ CW47 failed with error:', error);

    // Try to inform the user
    try {
      await interaction.editReply({
        content: `❌ **Ritual failed:** ${error.message}\nCheck the console for details.`,
      });
    } catch {
      console.error('  ❌ Could not send error reply to user.');
    }
  }
});

// ─── Login ─────────────────────────────────────────────────────────
client.login(DISCORD_TOKEN).catch((err) => {
  console.error('❌ Failed to login. Is your DISCORD_TOKEN correct?');
  console.error(err.message);
  process.exit(1);
});
