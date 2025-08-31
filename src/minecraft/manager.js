import express from "express";
import { spawn } from "child_process";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
import "../discord/logger.js";

const app = express();
app.use(express.json());
const port = 3000;

const altProcesses = {};
const altStatuses = {};
const onlineAlts = new Set();

import altsConfig from "../config.js";

const handleChildOutput = (data, res) => {
	const output = data.toString().trim();
	console.log(`output recieved from an alt: ${output}`);
	try {
		const eventData = JSON.parse(output);
		const altName = eventData.alt;

		if (eventData.type === "login") {
			console.log(`${altName} logged in successfully`);
			res.status(200).send(`${altName} was connected successfully.`);
			onlineAlts.add(altName);
			altStatuses[altName] = {
				status: "online",
				loginTime: eventData.loginTime,
				ign: eventData.ign,
			};
		} else if (eventData.type === "disconnect") {
			console.log(`${altName} disconnected from the server`);
			onlineAlts.delete(altName);
		} else if (eventData.type === "kicked") {
			const kickReason = eventData.reason;
			console.log(
				`${altName} was kicked from the server for ${kickReason}`
			);
		}
	} catch (error) {
		console.error(error);
	}
};

const connectAlt = (altName, res) => {
	console.log(`Starting script for ${altName}.`);
	if (onlineAlts.has(altName)) {
		res.status(400).send(`${altName} is already online!`);
		console.log(`Tried to start ${altName}, but it is already online!`);
	} else {
		const child = spawn("node", ["./alt-logic.js"], {
			env: {
				USER: altsConfig[altName].username,
				PASSWORD: altsConfig[altName].password,
				ALT: altName,
				TRUSTED_USERS: process.env.TRUSTED_USERS,
				PROXY_USER: altsConfig[altName].proxy.username,
				PROXY_PASSWORD: altsConfig[altName].proxy.password,
				PROXY_HOST: altsConfig[altName].proxy.host,
				PROXY_PORT: altsConfig[altName].proxy.port,
			},
		});
		altProcesses[altName] = child;

		// we treat child output as formatted json responses
		child.stdout.on("data", (data) => handleChildOutput(data, res));
		// we're using errors as general status messages
		child.stderr.on("data", (data) => console.log(`[${altName}]: ${data}`));

		child.on("exit", () => {
			if (onlineAlts.has(altName)) {
				console.log(
					`${altName} disconnected from the server forcefully, deleting from onlineAlts.`
				);
				onlineAlts.delete(altName);
			}
		});
	}
};

const disconnectAlt = (altName, res) => {
	const childProcess = altProcesses[altName];
	if (childProcess) {
		childProcess.kill();
		delete childProcess[altName];
		console.log(`killed the process for ${altName}`);
		res.status(200).send(`${altName} was disconnected successfully`);
	} else {
		res.status(404).send(`${altName} is not currently running`);
	}
};

const sendMessage = (altName, message, res) => {
	altProcesses[altName].stdin.write(`${message}\n`);
	res.status(200).json({ message: message });
};

app.get("/connect/:altName", (req, res) => {
	const altName = req.params.altName;
	if (altsConfig[altName]) connectAlt(altName, res);
});

app.get("/disconnect/:altName", (req, res) => {
	const altName = req.params.altName;
	if (altsConfig[altName]) disconnectAlt(altName, res);
});

app.post("/send/:altName", (req, res) => {
	const altName = req.params.altName;
	const message = req.body.message;
	if (altProcesses[altName]) {
		console.log(
			`${altName} is sending a message to the server: ${message}`
		);
		sendMessage(altName, message, res);
	} else {
		return res.status(400).json({
			error: `${altName} isn't online (did you connect it yet?)`,
		});
	}
});

app.get("/status", (req, res) => {
	const onlineList = Array.from(onlineAlts);
	res.status(200).json({ online: onlineList });
});

app.listen(port);
