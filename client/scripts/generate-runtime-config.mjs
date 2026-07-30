import fs from "fs";
import path from "path";

const apiUrl = process.env.MEETMIDWAY_API_URL || process.env.VITE_API_URL || "http://localhost:3000";
const socketUrl = process.env.MEETMIDWAY_SOCKET_URL || process.env.VITE_SOCKET_URL || apiUrl;

const outputPath = path.resolve(process.cwd(), "public", "runtime-config.js");
const output = `window.__MEETMIDWAY_CONFIG__ = ${JSON.stringify({ apiUrl, socketUrl }, null, 2)};\n`;

fs.writeFileSync(outputPath, output, "utf8");
console.log(`Wrote runtime config to ${outputPath}`);