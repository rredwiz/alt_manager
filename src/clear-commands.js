// run this whenever you need to clear old commands

import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const clientId = "1406148352051249202";
const guildId = "1403758662140563496";
const token = process.env.DISCORD_BOT_TOKEN;

const rest = new REST({ version: "10" }).setToken(token);

async function clearCommands() {
	try {
		console.log("Started clearing application (/) commands.");

		// clear server commands
		console.log("Clearing commands for this guild...");
		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: [] } // empty array means no commands left
		);
		console.log("Successfully cleared guild commands.");

		// clear global commands
		console.log("Clearing global commands...");
		await rest.put(Routes.applicationCommands(clientId), { body: [] });
		console.log("Successfully cleared global commands.");
	} catch (error) {
		console.error("Failed to clear commands:", error);
	}
}

clearCommands();
