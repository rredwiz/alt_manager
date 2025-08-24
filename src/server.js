import express from "express";
import { spawn } from "child_process";

const app = express();
app.use(express.json());
const port = 3000;

const altProcesses = {};
const onlineAlts = new Set();

// config is like this so info isn't public
import dotenv from "dotenv";
dotenv.config();

const altsConfig = {
	alt1: {
		username: process.env.ALT_1_USER,
		password: process.env.ALT_1_PASSWORD,
	},
	alt2: {
		username: process.env.ALT_2_USER,
		password: process.env.ALT_2_PASSWORD,
	},
	alt3: {
		username: process.env.ALT_3_USER,
		password: process.env.ALT_3_PASSWORD,
	},
	alt4: {
		username: process.env.ALT_4_USER,
		password: process.env.ALT_4_PASSWORD,
	},
};

const handleChildOutput = (data) => {
	const output = data.toString().trim();
	try {
		const eventData = JSON.parse(output);
		const altName = eventData.alt;
		if (eventData.type === "login") {
			console.log(`${altName} logged in successfully`);
			onlineAlts.add(altName);
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
	console.log(`starting script for ${altName}`);
	if (altProcesses[altName]) {
		res.status(400).send(`${altName} is already online`);
		console.log(`script is already running for ${altName}!`);
	} else {
		const child = spawn("node", ["alt_logic.js"], {
			env: {
				USER: altsConfig[altName].username,
				PASSWORD: altsConfig[altName].password,
				ALT: altName,
				TRUSTED_USERS: process.env.TRUSTED_USERS,
			},
		});
		altProcesses[altName] = child;
		res.status(200).send(`${altName} was connected successfully`);
		child.stdout.on("data", (data) => handleChildOutput(data));
		child.stderr.on("data", (data) =>
			console.error(`[${altName}]: ${data}`)
		);
		child.on("exit", () => {
			if (onlineAlts.has(altName)) {
				console.log(`${altName} disconnected from the server`);
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
	console.log(`message received from post was: ${message}`);
	if (altProcesses[altName]) {
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
