import { WebhookClient } from "discord.js";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

if (!webhookUrl) {
	console.log("Webhook URL not found. Logging to console only.");
} else {
	const webhookClient = new WebhookClient({ url: webhookUrl });

	// saving the original console functions
	const originalLog = console.log;
	const originalError = console.error;

	/**
	 * Formats a single argument for logging, handling Errors and objects.
	 * @param {*} arg The argument to format.
	 * @returns {string} The formatted string.
	 * thank you gemini for formatting my errors
	 */
	const formatArgument = (arg) => {
		// if the argument is a formal Error, return its stack trace for debugging
		if (arg instanceof Error) {
			return arg.stack;
		}
		// if it's an object (but not null), format it as a readable JSON string
		if (typeof arg === "object" && arg !== null) {
			return JSON.stringify(arg, null, 2);
		}
		// otherwise, just return it as is
		return arg;
	};

	const sendToWebhook = (message) => {
		const formattedMessage = "\n" + message + "\n";

		if (formattedMessage.length > 2000) {
			// splitting the message into chunks of 1990 characters to be safe
			// thank gemini for the regex
			const chunks = message.match(/[\s\S]{1,1990}/g) || [];
			for (const chunk of chunks) {
				webhookClient.send("\n" + chunk + "\n").catch((err) => {
					originalError("Failed to send log chunk to webhook:", err);
				});
			}
		} else {
			webhookClient.send(formattedMessage).catch((err) => {
				originalError("Failed to send log to webhook:", err);
			});
		}
	};

	console.log = function (...args) {
		originalLog.apply(console, args);

		const message = args.map(formatArgument).join(" ");
		sendToWebhook(message);
	};

	console.error = function (...args) {
		originalError.apply(console, args);

		const message = args.map(formatArgument).join(" ");
		sendToWebhook(`ERROR: ${message}`);
	};

	console.log("webhook logger started");
}
