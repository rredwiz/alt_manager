import express from "express";
import { spawn } from "child_process";

const app = express();
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

const altAction = (altName) => {
	// do something
	// by default im just testing, so im gonna make an alt connect
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

app.get("/manager/:altName", (req, res) => {
	const altName = req.params.altName;
	if (altsConfig[altName]) {
		altAction(altName);
	}
});

app.listen(port);
