import express from "express";
import { spawn } from "child_process";

const app = express();
app.use(express.json());
const port = 3000;

let altProcesses = {};

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

const connectAlt = (altName, res) => {
	console.log(`starting script for alt ${altName}`);
	const child = spawn("node", ["alt_logic.js"], {
		env: {
			USER: altsConfig[altName].username,
			PASSWORD: altsConfig[altName].password,
		},
	});
	altProcesses[altName] = child;
	child.stdout.on("data", (data) => console.log(`[${altName}]: ${data}`));
	child.stderr.on("data", (data) =>
		console.error(`[${altName} ERROR]: ${data}`)
	);
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

app.listen(port);
