import express from "express";
import { fork } from "child_process";
import dotenv from "dotenv";
import "../discord/logger.js";
import altsConfig from "../config.js";

dotenv.config({ path: "../../.env" });

const app = express();
app.use(express.json());
const port = 3000;

const altProcesses = {};
const altStatuses = {};

for (const altName of Object.keys(altsConfig)) {
	altStatuses[altName] = {
		status: "offline",
		ign: null,
		loginTime: null,
		lastDisconnect: null,
		disconnectReason: null,
	};
}

const handleChildMessage = (message) => {
	const altName = message.alt;

	if (!altName || !altStatuses[altName]) return;

	console.log(`output recieved from ${altName}`, message);

	switch (message.type) {
		case "login":
			console.log(`${altName} logged in as ${message.ign}`);
			altStatuses[altName] = {
				...altStatuses[altName],
				status: "online",
				ign: message.ign,
				loginTime: message.loginTime,
			};
			break;
		case "kicked":
			const { kickReason } = message;
			console.log(`${altName} was kicked for reason ${kickReason}`);
			altStatuses[altName] = {
				...altStatuses[altName],
				status: "offline",
				loginTime: null,
				lastDisconnect: new Date(),
				disconnectReason: kickReason,
			};
			break;
		case "disconnect":
			console.log(`${altName} was disconnected`);
			altStatuses[altName] = {
				...altStatuses[altName],
				status: "offline",
				loginTime: null,
				lastDisconnect: new Date(),
				disconnectReason: "forced disconnect",
			};
			break;
	}
};

const connectAlt = (altName) => {
	console.log(`Starting script for ${altName}.`);
	const child = fork("./alt-logic.js", {
		env: {
			...process.env,
			USER: altsConfig[altName].username,
			PASSWORD: altsConfig[altName].password,
			ALT: altName,
			PROXY_USER: altsConfig[altName].proxy.username,
			PROXY_PASSWORD: altsConfig[altName].proxy.password,
			PROXY_HOST: altsConfig[altName].proxy.host,
			PROXY_PORT: altsConfig[altName].proxy.port,
		},
		silent: true,
	});

	altProcesses[altName] = child;
	altStatuses[altName].status = "connecting";

	child.on("message", handleChildMessage);
	// we're using errors as general status messages
	child.stderr.on("data", (data) =>
		console.log(`[${altName}]: ${data.toString().trim()}`)
	);

	child.on("exit", (code) => {
		console.log(`${altName} exited with code ${code}`);
		if (altStatuses[altName].status !== "offline") {
			handleChildMessage({ type: "disconnect", alt: altName });
		}
		delete altProcesses[altName];
	});
};

const disconnectAlt = (altName, res) => {
	const childProcess = altProcesses[altName];
	if (childProcess) {
		childProcess.kill();
		delete altProcesses[altName];
		console.log(`killed the process for ${altName}`);
		res.status(200).send(`${altName} was disconnected successfully`);
	} else {
		res.status(404).send(`${altName} is not currently running`);
	}
};

app.get("/connect/:altName", (req, res) => {
	const { altName } = req.params;

	if (!altsConfig[altName]) {
		return res.status(404).send({
			error: `Alt not found in configuration. Did you make a typo?`,
		});
	}

	if (altProcesses[altName]) {
		res.status(400).send(`${altName} is already online!`);
		console.log(`Tried to start ${altName}, but it is already online!`);
	}

	connectAlt(altName);
	res.status(200).send(`${altName} command finished execution`);
});

app.get("/disconnect/:altName", (req, res) => {
	const { altName } = req.params;
	if (altsConfig[altName]) disconnectAlt(altName, res);
});

app.post("/send/:altName", (req, res) => {
	const { altName } = req.params;
	const { message } = req.body;
	const childProcess = altProcesses[altName];

	if (childProcess) {
		console.log(
			`${altName} is sending a message to the server: ${message}`
		);
		childProcess.send({ type: "chat", message });
		res.status(200).json({ message: message });
	} else {
		return res.status(400).json({
			error: `${altName} isn't online (did you connect it yet?)`,
		});
	}
});

app.get("/status", (req, res) => {
	res.status(200).json(altStatuses);
});

app.listen(port);
