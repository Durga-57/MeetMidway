import Redis from "ioredis";
import { Trip } from "../../../shared/types";

export const TRIP_TTL = 86400; // 24 hours

// ── In-memory fallback store ──────────────────────────────────────────────────
// Used when Redis is unavailable (e.g. local dev without Redis installed).
const memoryStore = new Map<string, { trip: Trip; expiresAt: number }>();

function memGet(code: string): Trip | null {
  const entry = memoryStore.get(`trip:${code}`);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(`trip:${code}`);
    return null;
  }
  return entry.trip;
}

function memSet(trip: Trip): void {
  memoryStore.set(`trip:${trip.code}`, {
    trip,
    expiresAt: Date.now() + TRIP_TTL * 1000,
  });
}

function memDel(code: string): void {
  memoryStore.delete(`trip:${code}`);
}

// ── Redis client ───────────────────────────────────────────────────────────────
let redisAvailable = false;
let redis: Redis | null = null;
let redisReady: Promise<void> = Promise.resolve();

try {
  redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
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
  redisReady = redis.connect().catch(() => {
    redisAvailable = false;
    console.warn("⚠️  Redis unavailable — using in-memory store (data won't persist across restarts)");
  });
} catch {
  redis = null;
  redisAvailable = false;
  console.warn("⚠️  Redis unavailable — using in-memory store");
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function saveTrip(trip: Trip): Promise<void> {
  await redisReady;
  if (redis && redisAvailable) {
    try {
      await redis.set(`trip:${trip.code}`, JSON.stringify(trip), "EX", TRIP_TTL);
      return;
    } catch {
      redisAvailable = false;
    }
  }
  memSet(trip);
}

export async function getTrip(code: string): Promise<Trip | null> {
  await redisReady;
  if (redis && redisAvailable) {
    try {
      const raw = await redis.get(`trip:${code}`);
      if (!raw) return null;
      return JSON.parse(raw) as Trip;
    } catch {
      redisAvailable = false;
    }
  }
  return memGet(code);
}

export async function deleteTrip(code: string): Promise<void> {
  await redisReady;
  if (redis && redisAvailable) {
    try {
      await redis.del(`trip:${code}`);
      return;
    } catch {
      redisAvailable = false;
    }
  }
  memDel(code);
}

export default redis;
