import mineflayer from "mineflayer";

const options = {
	host: "donutsmp.net",
	auth: "microsoft",
	username: process.env.ALT_1_USER,
	password: process.env.ALT_1_PASSWORD,
	version: "1.21.7",
};

const alt = mineflayer.createBot(options);

alt.on("login", () => {
	console.log("logged in as");
});

alt.on("spawn", () => {
	// redwizalt1.chat("hi");
});

alt.on("kicked", (reason) => {
	console.log(`bot was kicked for reason: ${reason}`);
});

alt.on("error", () => {
	console.log("error happened lols");
});

alt.on("end", () => {
	console.log("bot disconnected, process finished");
});
