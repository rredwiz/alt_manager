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

alt.on("login", () => {
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
	const username = matches[0].toString();
	console.error(`tpa request was sent by ${username}`);

	if (trustedUsers.has(username)) {
		// we get a random delay between 1000 - 1200 milliseconds to not cause suspicion of bots to the server
		const randomDelay = Math.floor(Math.random() * 201) + 1000;

		console.error(
			`trusted user, accepting tpa request from ${username} with random delay ${randomDelay}`
		);
		setTimeout(() => {
			alt.chat(`/tpaccept ${username}`);
		}, randomDelay);
	} else {
		console.error(
			`${username} did not match trusted users, request was not accepted`
		);
	}
});

alt.on("kicked", (reason) => {
	const kickedData = {
		type: "kicked",
		reason: reason,
		alt: ALT,
	};
	process.stdout.write(JSON.stringify(kickedData) + "\n");
});

alt.on("error", (error) => {
	console.error(`Bot responded with error: ${error}`);
});

alt.on("end", () => {
	const disconnectedData = {
		type: "disconnect",
		alt: ALT,
	};
	process.stdout.write(JSON.stringify(disconnectedData) + "\n");
});
