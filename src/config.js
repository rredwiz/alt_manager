import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const ALTS_PER_PROXY = Number(process.env.ALTS_PER_PROXY);

// must be formatted user1:pass1,user2:pass2,...
const credentials = process.env.ALT_CREDENTIALS.split(",");
// must be formatted user1:pass1:host1:port1,user2:pass2:host2:port2,...
const proxies_info = process.env.PROXIES_INFO.split(",");

const alt_usernames = [];
const alt_passwords = [];

for (const pair of credentials) {
	const [username, password] = pair.split(":");
	if (username && password) {
		alt_usernames.push(username);
		alt_passwords.push(password);
	}
}

if (alt_usernames.length !== alt_passwords.length)
	throw new Error(`Username and password arrays do not match.`);

const altsConfig = {};
for (let i = 0; i < credentials.length; i++) {
	const altKey = `alt${i + 1}`;

	const proxyIndex = Math.floor(i / ALTS_PER_PROXY);
	const proxyData = proxies_info[proxyIndex].split(":");

	const proxyUser = proxyData[0];
	const proxyPass = proxyData[1];
	const proxyHost = proxyData[2];
	const proxyPort = proxyData[3];

	altsConfig[altKey] = {
		username: alt_usernames[i],
		password: alt_passwords[i],
		proxy: {
			username: proxyUser,
			password: proxyPass,
			host: proxyHost,
			port: proxyPort,
		},
	};
}

// const altsConfig = {
// 	alt1: {
// 		username: process.env.ALT_1_USER,
// 		password: process.env.ALT_1_PASSWORD,
// 	},
// 	alt2: {
// 		username: process.env.ALT_2_USER,
// 		password: process.env.ALT_2_PASSWORD,
// 	},
// 	alt3: {
// 		username: process.env.ALT_3_USER,
// 		password: process.env.ALT_3_PASSWORD,
// 	},
// 	alt4: {
// 		username: process.env.ALT_4_USER,
// 		password: process.env.ALT_4_PASSWORD,
// 	},
// };

export default altsConfig;
