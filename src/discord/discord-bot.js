import { Client, EmbedBuilder, GatewayIntentBits, Status } from "discord.js";
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

// sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectAlt(interaction) {
	const altName = interaction.options.getString("alt-name");
	console.log(`attempting to connect ${altName}`);
	await interaction.deferReply();

	try {
		const response = await fetch(
			`${MANAGER_SERVER_URL}/connect/${altName}`
		);

		if (!response.ok) {
			throw new Error(`failed to start connection for ${altName}`);
		}

		let statuses = null;

		let isOnline = false;
		for (let i = 0; i < 5; i++) {
			const statusResponse = await fetch(`${MANAGER_SERVER_URL}/status`);
			statuses = await statusResponse.json();

			if (statuses[altName]?.status === "online") {
				isOnline = true;
				break;
			}

			console.log("sleeping for 2000ms for retry");
			await sleep(2000);
		}

		if (isOnline)
			return interaction.editReply(
				`Successfully logged ${altName} in as ${statuses[altName].ign}.`
			);
		return interaction.editReply(`not worked`);
	} catch (error) {
		console.error(error);
		return interaction.editReply(
			`Something went wrong, ${altName} failed to connect (check console).`
		);
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
		console.error(error);
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

// helper for status to handle uptime and downtime
function formatDuration(timestampString) {
	if (!timestampString) return "N/A";

	const startTime = new Date(timestampString);
	const durationMs = new Date() - startTime;

	const hours = Math.floor(durationMs / (1000 * 60 * 60));
	const minutes = Math.floor((durationMs / (1000 * 60)) % 60);

	let parts = [];
	if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
	if (minutes > 0 && hours < 1)
		parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);

	if (parts.length === 0) return "Just now";
	if (parts.length === 1) return parts;
	return parts.join(", ");
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

		let descLines = "";
		const offlineEmoji = "<:1191031707126743173:1411889615627091968>";
		const onlineEmoji = "<:1191031705495154730:1411889613982662828>";

		for (const altName in data) {
			const altData = data[altName];

			const indicator =
				altData.status === "online" ? onlineEmoji : offlineEmoji;
			const timeDesc =
				altData.status === "online"
					? `Uptime: \`${formatDuration(altData.loginTime)}\``
					: `Downtime: \`${formatDuration(altData.lastDisconnect)}\``;

			descLines += `${indicator} **${altName}** (${altData.ign}) - ${timeDesc}\n`;
		}

		const statusEmbed = new EmbedBuilder()
			.setColor("#888888")
			.setTitle("Alt Status Report")
			.setThumbnail(
				"https://cdn.discordapp.com/attachments/1408601764428513353/1411900234757574666/pngimg.com_-_ruby_PNG44.png?ex=68b6560f&is=68b5048f&hm=1ff1120d97207826cc5c5d0077a796e6dfcb14a2de77baacc865b6f18cccbc4b&"
			)
			.setDescription(
				`Showing live status for all ruby alts.\n\n${descLines}`
			)
			.setFooter({
				text: `Requested Status by ${interaction.user.username}`,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setTimestamp();

		interaction.editReply({ embeds: [statusEmbed] });
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
