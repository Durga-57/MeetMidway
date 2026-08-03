import fs from "fs";
import path from "path";

const apiUrl = process.env.MEETMIDWAY_API_URL || process.env.VITE_API_URL || "";
const socketUrl = process.env.MEETMIDWAY_SOCKET_URL || process.env.VITE_SOCKET_URL || "";
const clientUrl = process.env.MEETMIDWAY_CLIENT_URL || process.env.VITE_CLIENT_URL || "";
const supabaseUrl = process.env.MEETMIDWAY_SUPABASE_URL || "https://lqznekygocrdiiouwkjb.supabase.co";
const supabasePublishableKey = process.env.MEETMIDWAY_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxem5la3lnb2NyZGlpb3V3a2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjI0MTYsImV4cCI6MjEwMDk5ODQxNn0.Zia31wPpsgs60ThUy-39axkk_N9uxzkpKdHiL876UBk";

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

if (clientUrl) {
	config.clientUrl = clientUrl;
}

if (supabaseUrl) config.supabaseUrl = supabaseUrl;
if (supabasePublishableKey) config.supabasePublishableKey = supabasePublishableKey;

const output = `window.__MEETMIDWAY_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`;

fs.writeFileSync(outputPath, output, "utf8");
console.log(`Wrote runtime config to ${outputPath}`);
