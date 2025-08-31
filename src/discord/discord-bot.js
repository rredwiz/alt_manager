import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";
import AbortController from "abort-controller";

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMembers,
	],
});

import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
const TOKEN = process.env.DISCORD_BOT_TOKEN;

const MANAGER_SERVER_URL = "http://localhost:3000";

client.on("clientReady", async () => {
	console.log("discord bot is logged in");
});

async function connectAlt(interaction) {
	const altName = interaction.options.getString("alt-name");
	await interaction.deferReply();

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 15000);

	try {
		const response = await fetch(
			`${MANAGER_SERVER_URL}/connect/${altName}`,
			{ signal: controller.signal }
		);
		const text = await response.text();
		if (text) {
			console.log(text);
			console.log(`connect command successfully started ${altName}`);
			return interaction.editReply(text);
		}
		return interaction.editReply(
			`${altName} successfully connected but response text was null.`
		);
	} catch (error) {
		console.log(error);
		return interaction.editReply(
			`Something went wrong, ${altName} failed to connect (check console).`
		);
	} finally {
		clearTimeout(timeoutId);
	}
}

async function disconnectAlt(interaction) {
	const altName = interaction.options.getString("alt-name");
	await interaction.deferReply();

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 15000);

	try {
		const response = await fetch(
			`${MANAGER_SERVER_URL}/disconnect/${altName}`,
			{ signal: controller.signal }
		);
		const text = await response.text();
		if (text) {
			console.log(text);
			return interaction.editReply(text);
		}
		return interaction.editReply(
			`${altName} successfully disconnected but response text was null.`
		);
	} catch (error) {
		console.log(error);
		return interaction.editReply(
			`Something went wrong, ${altName} failed to disconnect (check console).`
		);
	} finally {
		clearTimeout(timeoutId);
	}
}

async function sendMessage(interaction) {
	const altName = interaction.options.getString("alt-name");
	const messageToSend = interaction.options.getString("send");
	await interaction.deferReply();

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 15000);

	try {
		const response = await fetch(`${MANAGER_SERVER_URL}/send/${altName}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ message: messageToSend }),
			signal: controller.signal,
		});
		const data = await response.json();
		interaction.editReply(
			`${altName} successfully sent message: ${data.message}`
		);
	} catch (error) {
		console.error(error);
		interaction.editReply(
			`An error occurred, ${altName} could not send "${messageToSend}"`
		);
	} finally {
		clearTimeout(timeoutId);
	}
}

async function handleStatus(interaction) {
	await interaction.deferReply();

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 15000);

	try {
		const response = await fetch(`${MANAGER_SERVER_URL}/status`, {
			signal: controller.signal,
		});
		const data = await response.json();
		const onlineList = data.online;
		interaction.editReply(`Online alts: ${onlineList}`);
	} catch (error) {
		console.error(error);
		interaction.editReply(
			`An error occurred, couldn't retrieve alt status.`
		);
	} finally {
		clearTimeout(timeoutId);
	}
}

async function connectAllAlts(interaction) {
	await interaction.deferReply({
		content: `Connecting all alts to the server...`,
	});
}

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName } = interaction;

	if (commandName === "start-alt") await connectAlt(interaction);
	if (commandName === "stop-alt") await disconnectAlt(interaction);
	if (commandName === "status") await handleStatus(interaction);
	if (commandName === "send-text") await sendMessage(interaction);
	if (commandName === "start-all-alts") await connectAllAlts(interaction);
});

client.login(TOKEN);
