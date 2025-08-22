import mineflayer from "mineflayer";

const USER = process.env.USER;
const ALT = process.env.ALT;

const options = {
	host: "donutsmp.net",
	auth: "microsoft",
	username: USER,
	version: "1.20.4",
};

let alt = null;

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

alt.on("spawn", () => {});

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
