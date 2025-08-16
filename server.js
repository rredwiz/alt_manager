import express from "express";
import { spawn } from "child_process";

const app = express();
const port = 3000;

let altProcesses = {};

// config is like this so info isn't public
import dotenv from "dotenv";
dotenv.config();

const altsConfig = {
	redwizalt1: {
		username: process.env.ALT_1_USER,
		password: process.env.ALT_1_PASSWORD,
	},
	redwizalt3: {
		username: process.env.ALT_2_USER,
		password: process.env.ALT_2_PASSWORD,
	},
};

const altAction = (altName) => {
	if (!altProcesses[altName]) {
		console.log(
			`${altName} is not running right now! Can't perform action.`
		);
		return;
	}
	// do something
};

app.get("/reconnect/:altName", (req, res) => {
	const altName = req.params.altName;
	if (altsConfig[altName]) {
		altAction();
	}
});
