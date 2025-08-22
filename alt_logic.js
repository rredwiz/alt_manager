import mineflayer from "mineflayer";

const options = {
	host: "donutsmp.net",
	auth: "microsoft",
	username: process.env.USER,
	version: "1.20.4",
};

const alt = mineflayer.createBot(options);

alt.on("login", () => {
	console.log(`logged in as ${alt.username}`);
});

alt.on("spawn", () => {
	// idk yet
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
