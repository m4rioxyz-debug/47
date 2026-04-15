# Discord Bot Setup Guide

## Requirements
- Node.js v16.9.0 or higher
- A Discord Bot Token (from Discord Developer Portal)
- Privileged Gateway Intents enabled: `Guild Members`, `Message Content`, `Presence Intent`

## Installation
1. Clone this repository or copy the files.
2. Run `npm install` to install dependencies.
3. Rename `.env.example` to `.env` and fill in your `DISCORD_TOKEN`.
4. Open `config.json` and fill in the necessary IDs:
   - `clientId`: Your bot's ID
   - `guildId`: Your server's ID
   - `botAdmins`: Array of user IDs that are immune to anti-nuke
   - `roles`: IDs for auto-role, mute, and booster perks
   - `channels`: IDs for welcome, logs, and ticket category

## Running the Bot
- **Deploy Slash Commands:** `npm run deploy` (Note: My ready event handles this automatically too)
- **Start the Bot:** `npm start` or `node index.js`

## Features
- **Anti-Nuke:** Prevents mass channel deletion (configurable thresholds in `config.json`).
- **Auto Role & Welcome:** Automatically assigns a role to new members and sends a welcome embed.
- **Moderation:** Full suite of slash commands (/ban, /kick, /clear, /warn).
- **Tickets:** Interactive button-based ticket system with forms (modals) and HTML transcripts.
- **Mass Nickname:** Quickly sync server nicknames with a custom prefix.
- **Booster Perks:** Automatic role assignment for server boosters.

## File Structure
- `index.js`: Main entry.
- `src/commands/`: Command files categorized.
- `src/events/`: Event handlers for bot/guild events.
- `src/handlers/`: Logics for loading commands/events and handling errors.
- `src/utils/`: Database and helper functions.
- `database.json`: local JSON storage for tickets and warns.
"# 47" 
