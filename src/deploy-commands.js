// run this whenever you need to deploy new commands

import {
	REST,
	Routes,
	SlashCommandBuilder,
	PermissionFlagsBits,
} from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const clientId = "1406148352051249202";
const guildId = "1403758662140563496";
const token = process.env.DISCORD_BOT_TOKEN;

// commands go here
const commands = [
	new SlashCommandBuilder()
		.setName("status")
		.setDescription("Returns a list of the alts that are online."),
	// .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	new SlashCommandBuilder()
		.setName("start-alt")
		.setDescription("Starts a specific alt.")
		.addStringOption((option) =>
			option
				.setName("alt-name")
				.setDescription(
					"The name of the alt to start (alt1, alt2, etc...)."
				)
				.setRequired(true)
		),
	// .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	new SlashCommandBuilder()
		.setName("stop-alt")
		.setDescription("Stops a specific alt.")
		.addStringOption((option) =>
			option
				.setName("alt-name")
				.setDescription(
					"The name of the alt to stop (alt1, alt2, etc...)."
				)
				.setRequired(true)
		),
	// .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	new SlashCommandBuilder()
		.setName("send-text")
		.setDescription("Make a specified alt send a message or command.")
		.addStringOption((option) =>
			option
				.setName("alt-name")
				.setDescription(
					"The name of the alt that you want to send a message or command (alt1, alt2, etc...)."
				)
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("send")
				.setDescription(
					"The output text you want to send to the server (can be any message or command)."
				)
				.setRequired(true)
		),
	// .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
	try {
		console.log("Started refreshing application (/) commands.");
		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId), // use applicationCommands(clientId) for global
			{ body: commands }
		);
		console.log("Successfully reloaded application (/) commands.");
	} catch (error) {
		console.error(error);
	}
})();
