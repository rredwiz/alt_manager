import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

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

export default altsConfig;
