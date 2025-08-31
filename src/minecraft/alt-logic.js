import mineflayer from "mineflayer";
import mcprotocol from "minecraft-protocol";
import socks from "socks";

const USER = process.env.USER;
const ALT = process.env.ALT;
const PROXY_USER = process.env.PROXY_USER;
const PROXY_PASSWORD = process.env.PROXY_PASSWORD;
const PROXY_HOST = process.env.PROXY_HOST;
const PROXY_PORT = Number(process.env.PROXY_PORT);
const SERVER_HOST = "donutsmp.net";
const SERVER_PORT = 25565;
const MC_VERSION = "1.19.3";

// we use the 'or' check in case .env is empty
const trustedUsersString = process.env.TRUSTED_USERS || "";
if (!trustedUsersString)
	process.stderr.write(
		`You have no trusted users, bot will never accept teleports automatically from anyone!`
	);

const trustedUsers = new Set(trustedUsersString.split(","));

const client = mcprotocol.createClient({
	host: SERVER_HOST,
	port: SERVER_PORT,
	username: USER,
	version: MC_VERSION,
	auth: "microsoft",
	connect: (client) => {
		socks.SocksClient.createConnection(
			{
				proxy: {
					type: 5,
					userId: PROXY_USER,
					password: PROXY_PASSWORD,
					host: PROXY_HOST,
					port: PROXY_PORT,
				},
				command: "connect",
				destination: {
					host: SERVER_HOST,
					port: SERVER_PORT,
				},
			},
			(err, info) => {
				if (err) {
					process.stderr.write(`SOCKS connection error: ${err}`);
					client.emit("error", err);
					return;
				}

				process.stderr.write(`SOCKS tunnel established, connecting...`);
				client.setSocket(info.socket);
				client.emit("connect");
			}
		);
	},
});

let alt = null;

// alt input handling for chatting (basically just chats whatever it's given rn)
// ill probably make this a json object later but im lazy
process.stdin.on("data", (data) => {
	if (alt) {
		const message = data.toString().trim();
		alt.chat(message);
	}
});

alt = mineflayer.createBot({
	client: client,
});

alt.once("login", () => {
	const loginTime = new Date();
	const ign = alt.username;

	const loginData = {
		type: "login",
		loginTime: loginTime,
		ign: ign,
		alt: ALT,
	};
	process.stdout.write(JSON.stringify(loginData) + "\n");
});

const tpaRegex = /(\w+) sent you a tpa request/i;

alt.once("spawn", () => {
	alt.addChatPatternSet("tpaRequest", [tpaRegex], {
		repeat: true,
		parse: true,
	});
});

alt.on("chat:tpaRequest", (matches) => {
	const username = matches[0].toString().toLowerCase();
	process.stderr.write(`tpa request was sent by ${username}\n`);

	if (trustedUsers.has(username)) {
		// we get a random delay between 1000 - 1700 milliseconds to not cause as much suspicion
		const randomDelay = Math.floor(Math.random() * 701) + 1000;

		process.stderr.write(
			`trusted user, accepting tpa request from ${username} with random delay ${randomDelay}`
		);
		setTimeout(() => {
			alt.chat(`/tpaccept ${username}`);
		}, randomDelay);
	} else {
		process.stderr.write(
			`${username} did not match trusted users, request was not accepted`
		);
	}
});

alt.on("kicked", (reason, loggedIn) => {
	const kickReason = JSON.stringify(reason);
	const kickedData = {
		type: "kicked",
		reason: kickReason,
		loggedIn: loggedIn,
		alt: ALT,
	};
	process.stdout.write(JSON.stringify(kickedData));
	process.stderr.write(`alt was kicked with kick reason ${kickReason}`);
});

alt.on("error", (error) => {
	process.stderr.write(`bot responded with error: ${error}`);
});

alt.on("end", () => {
	const disconnectedData = {
		type: "disconnect",
		alt: ALT,
	};
	process.stdout.write(JSON.stringify(disconnectedData) + "\n");
});
