/* 
	This file is for registering new alts because they dont work with proxies.
	Argument after file is the user, next is the server host.
	Usage: node ./register-alt.js <user> <server>
	If the port doesn't work try a different server :sob: (im lazy)
*/

import mineflayer from "mineflayer";

if (!process.argv[2] || !process.argv[3]) {
	console.log(`Usage: node ./register-alt.js <user> <server>`);
	process.exit(0);
}

const USER = process.argv[2];
const SERVER_HOST = process.argv[3];
const SERVER_PORT = 25565;
const MC_VERSION = "1.19.3";

const alt = mineflayer.createBot({
	host: SERVER_HOST,
	port: SERVER_PORT,
	username: USER,
	version: MC_VERSION,
	auth: "microsoft",
});

alt.once("login", () => {
	console.log(
		`${alt.username} was logged in successfully after registering.`
	);
});

alt.on("kicked", (reason) => {
	console.log(
		`Alt was kicked from the server for reason: ${JSON.stringify(reason)}.`
	);
});

alt.on("error", (error) => {
	console.log(`An error occurred: ${error}`);
});

alt.on("end", () => {
	console.log(`Alt process ended.`);
});
