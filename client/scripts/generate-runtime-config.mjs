import fs from "fs";
import path from "path";

const apiUrl = process.env.MEETMIDWAY_API_URL || process.env.VITE_API_URL || "";
const socketUrl = process.env.MEETMIDWAY_SOCKET_URL || process.env.VITE_SOCKET_URL || "";

const outputPath = path.resolve(process.cwd(), "public", "runtime-config.js");
const config = {};

if (apiUrl) {
	config.apiUrl = apiUrl;
}

if (socketUrl) {
	config.socketUrl = socketUrl;
} else if (apiUrl) {
	config.socketUrl = apiUrl;
}

const output = `window.__MEETMIDWAY_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`;

fs.writeFileSync(outputPath, output, "utf8");
console.log(`Wrote runtime config to ${outputPath}`);