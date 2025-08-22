import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";

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
import { json } from "express";
dotenv.config();
const TOKEN = process.env.DISCORD_BOT_TOKEN;

const MANAGER_SERVER_URL = "http://localhost:3000";

client.on("clientReady", async () => {
	console.log("discord bot is logged in");
});

// attempts to connect the alt specified in the user's message
async function connectAlt(message) {
	const args = message.content.split(" ");
	if (args.length < 2) {
		return message.reply(
			"You provided too few arguments. Usage: '>connect {alt number}' Example: '>connect alt1'"
		);
	} else if (args.length > 2) {
		return message.reply(
			"You provided too many arguments. Usage: '>connect {alt number}' Example: '>connect alt1'"
		);
	}
	const altName = args[1];
	try {
		const response = await fetch(
			`${MANAGER_SERVER_URL}/connect/${altName}`
		);
		const text = await response.text();
		if (text) {
			console.log(text);
			console.log("command successfully started the bot");
		}
	} catch (error) {
		console.log(error);
	}
}

//TODO:
// attempts to send a message (or command) via the alt specified in the user's message
async function sendMessage(message) {
	const args = message.content.split(" ");
	if (args.length < 3) {
		return message.reply(
			"You provided too few arguments. Usage: '>send {alt number} {message}' Example: '>send alt1 /home 1'. Other example: '>send alt2 hello world!'"
		);
	}
	const altName = args[1];
	const messageToSend = args.slice(2).join(" ");
	try {
		const response = await fetch(`${MANAGER_SERVER_URL}/send/${altName}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ message: messageToSend }),
		});
		console.log(`messageToSend (post body was): ${messageToSend}`);
		const data = await response.json();
		message.reply(`${altName} sent message: ${data.message}`);
	} catch (error) {
		console.error(error);
	}
}

client.on("messageCreate", async (message) => {
	if (message.author.bot) return;

	if (message.content.startsWith(">connect")) {
		connectAlt(message);
	}

	if (message.content.startsWith(">send")) {
		sendMessage(message);
	}
});

client.login(TOKEN);
