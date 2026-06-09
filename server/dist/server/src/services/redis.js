"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRIP_TTL = void 0;
exports.saveTrip = saveTrip;
exports.getTrip = getTrip;
exports.deleteTrip = deleteTrip;
const ioredis_1 = __importDefault(require("ioredis"));
exports.TRIP_TTL = 86400; // 24 hours
// ── In-memory fallback store ──────────────────────────────────────────────────
// Used when Redis is unavailable (e.g. local dev without Redis installed).
const memoryStore = new Map();
function memGet(code) {
    const entry = memoryStore.get(`trip:${code}`);
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        memoryStore.delete(`trip:${code}`);
        return null;
    }
    return entry.trip;
}
function memSet(trip) {
    memoryStore.set(`trip:${trip.code}`, {
        trip,
        expiresAt: Date.now() + exports.TRIP_TTL * 1000,
    });
}
function memDel(code) {
    memoryStore.delete(`trip:${code}`);
}
// ── Redis client ───────────────────────────────────────────────────────────────
let redisAvailable = false;
let redis = null;
try {
    redis = new ioredis_1.default(process.env.REDIS_URL || "redis://localhost:6379", {
        lazyConnect: true,
        enableOfflineQueue: false,
        retryStrategy(times) {
            if (times > 2) {
                if (redisAvailable !== false) {
                    console.warn("⚠️  Redis unavailable — using in-memory store (data won't persist across restarts)");
                    redisAvailable = false;
                }
                return null; // stop retrying
            }
            return Math.min(times * 300, 1000);
        },
    });
    redis.on("connect", () => {
        redisAvailable = true;
        console.log("✅ Redis connected");
    });
    redis.on("error", () => {
        redisAvailable = false;
    });
    // Attempt connection
    redis.connect().catch(() => {
        redisAvailable = false;
        console.warn("⚠️  Redis unavailable — using in-memory store (data won't persist across restarts)");
    });
}
catch {
    redis = null;
    redisAvailable = false;
    console.warn("⚠️  Redis unavailable — using in-memory store");
}
// ── Public API ─────────────────────────────────────────────────────────────────
async function saveTrip(trip) {
    if (redis && redisAvailable) {
        try {
            await redis.set(`trip:${trip.code}`, JSON.stringify(trip), "EX", exports.TRIP_TTL);
            return;
        }
        catch {
            redisAvailable = false;
        }
    }
    memSet(trip);
}
async function getTrip(code) {
    if (redis && redisAvailable) {
        try {
            const raw = await redis.get(`trip:${code}`);
            if (!raw)
                return null;
            return JSON.parse(raw);
        }
        catch {
            redisAvailable = false;
        }
    }
    return memGet(code);
}
async function deleteTrip(code) {
    if (redis && redisAvailable) {
        try {
            await redis.del(`trip:${code}`);
            return;
        }
        catch {
            redisAvailable = false;
        }
    }
    memDel(code);
}
exports.default = redis;
