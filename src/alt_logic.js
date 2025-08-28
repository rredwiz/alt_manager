import mineflayer from "mineflayer";

const USER = process.env.USER;
const ALT = process.env.ALT;

// we use the 'or' check in case .env is empty
const trustedUsersString = process.env.TRUSTED_USERS || "";

const trustedUsers = new Set(trustedUsersString.split(","));

const options = {
	host: "donutsmp.net",
	auth: "microsoft",
	username: USER,
	version: "1.20.4",
};

let alt = null;

// alt input handling for chatting (basically just chats whatever it's given rn)
process.stdin.on("data", (data) => {
	if (alt) {
		const message = data.toString().trim();
		alt.chat(message);
	}
});

alt = mineflayer.createBot(options);

alt.once("login", () => {
	const loginData = {
		type: "login",
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
	process.stderr.write(`tpa request was sent by ${username}`);

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
