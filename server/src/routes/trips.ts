import { Router, Request, Response } from "express";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { Trip, PlaceType, Friend, FRIEND_COLORS, PLACE_TYPE_LABELS } from "../../../shared/types";
import { getTrip, saveTrip } from "../services/redis";
import { computeMidpoint, scorePlaces } from "../services/scoring";
import { fetchNearbyPlaces } from "../services/overpass";
import { requireAuth } from "../middleware/auth";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "MeetMidway/1.0";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidPlaceType(value: unknown): value is PlaceType {
  return typeof value === "string" && value in PLACE_TYPE_LABELS;
}

async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({
      format: "json",
      q: address,
      limit: "1",
    });

    const response = await fetch(`${NOMINATIM_BASE}?${params.toString()}`, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      console.error(`Nominatim geocode returned ${response.status}`);
      return null;
    }

    const data = (await response.json()) as any[];
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (err: any) {
    console.error("geocodeAddress error:", err.message || err);
    return null;
  }
}

async function buildFriend(name: string, address: string, colorIndex: number): Promise<Friend | null> {
  const coords = await geocodeAddress(address);
  if (!coords) return null;

  return {
    id: uuidv4(),
    name,
    address,
    lat: coords.lat,
    lng: coords.lng,
    color: FRIEND_COLORS[colorIndex % FRIEND_COLORS.length],
    joinedAt: Date.now(),
  };
}

export function tripsRouter(io: Server): Router {
  const router = Router();

  // POST /api/trips — create a new trip
  router.post("/", requireAuth, async (req: Request, res: Response) => {
    const { name, placeType } = req.body as {
      name?: string;
      placeType?: PlaceType;
      creatorName?: string;
      creatorAddress?: string;
    };
    const tripName = normalizeText(name);
    const creatorName = normalizeText(req.body?.creatorName);
    const creatorAddress = normalizeText(req.body?.creatorAddress);

    if (!tripName || !placeType || !creatorName || !creatorAddress) {
      return res.status(400).json({ error: "name, placeType, creatorName, and creatorAddress are required" });
    }

    if (tripName.length < 2 || tripName.length > 60) {
      return res.status(400).json({ error: "Trip name must be between 2 and 60 characters" });
    }

    if (!isValidPlaceType(placeType)) {
      return res.status(400).json({ error: "Invalid place category" });
    }

    if (creatorName.length < 2 || creatorName.length > 40) {
      return res.status(400).json({ error: "Creator name must be between 2 and 40 characters" });
    }

    if (creatorAddress.length < 3 || creatorAddress.length > 240) {
      return res.status(400).json({ error: "Creator address must be between 3 and 240 characters" });
    }

    let code = generateCode();
    // Ensure unique code
    while (await getTrip(code)) {
      code = generateCode();
    }

    const now = Date.now();
    const creator = await buildFriend(creatorName, creatorAddress, 0);

    if (!creator) {
      return res.status(422).json({ error: "Creator address not found" });
    }

    const trip: Trip = {
      code,
      name: tripName,
      placeType,
      friends: [creator],
      createdAt: now,
      expiresAt: now + 86400 * 1000,
      places: [],
      votes: {},
    };

    await saveTrip(trip);
    return res.status(201).json({ code, trip });
  });

  // GET /api/trips/:code — fetch trip
  router.get("/:code", async (req: Request, res: Response) => {
    const trip = await getTrip(req.params.code.toUpperCase());
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    return res.json({ trip });
  });

  // POST /api/trips/:code/friends — add a friend
  router.post("/:code/friends", requireAuth, async (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { name, address } = req.body as { name?: string; address?: string };
    const friendName = normalizeText(name);
    const friendAddress = normalizeText(address);

    if (!friendName || !friendAddress) {
      return res.status(400).json({ error: "name and address are required" });
    }

    if (friendName.length < 2 || friendName.length > 40) {
      return res.status(400).json({ error: "Name must be between 2 and 40 characters" });
    }

    if (friendAddress.length < 3 || friendAddress.length > 240) {
      return res.status(400).json({ error: "Address must be between 3 and 240 characters" });
    }

    const trip = await getTrip(code);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    const coords = await geocodeAddress(friendAddress);
    if (!coords) {
      return res.status(422).json({ error: "Address not found" });
    }

    // Deduplicate name
    let dedupedFriendName = friendName;
    const existingNames = trip.friends.map((f) => f.name);
    if (existingNames.includes(dedupedFriendName)) {
      let counter = 2;
      while (existingNames.includes(`${dedupedFriendName} ${counter}`)) counter++;
      dedupedFriendName = `${dedupedFriendName} ${counter}`;
    }

    const color = FRIEND_COLORS[trip.friends.length % FRIEND_COLORS.length];
    const friend: Friend = {
      id: uuidv4(),
      name: dedupedFriendName,
      address: friendAddress,
      lat: coords.lat,
      lng: coords.lng,
      color,
      joinedAt: Date.now(),
    };

    trip.friends.push(friend);
    await saveTrip(trip);

    // Emit to room
    io.to(code).emit("friend:joined", { friends: trip.friends });

    return res.status(201).json({ friend, trip });
  });

  // DELETE /api/trips/:code/friends/:friendId — remove a friend
  router.delete(
    "/:code/friends/:friendId",
    requireAuth,
    async (req: Request, res: Response) => {
      const code = req.params.code.toUpperCase();
      const { friendId } = req.params;

      const trip = await getTrip(code);
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      const before = trip.friends.length;
      trip.friends = trip.friends.filter((f) => f.id !== friendId);
      if (trip.friends.length === before) {
        return res.status(404).json({ error: "Friend not found" });
      }

      await saveTrip(trip);
      io.to(code).emit("friend:left", { friendId });

      return res.json({ trip });
    }
  );

  // POST /api/trips/:code/search — find places
  router.post("/:code/search", requireAuth, async (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { placeType, radiusKm } = req.body as {
      placeType?: PlaceType;
      radiusKm?: number;
    };

    const trip = await getTrip(code);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    if (trip.friends.length < 2) {
      return res
        .status(400)
        .json({ error: "Need at least 2 friends to search" });
    }

    const type = placeType || trip.placeType;
    const radius = radiusKm || 5;

    const midpoint = computeMidpoint(trip.friends);

    try {
      const attemptRadii = [radius, Math.min(Math.max(radius * 1.5, radius + 2), 20)];
      let rawPlaces = [] as Awaited<ReturnType<typeof fetchNearbyPlaces>>;

      for (const attemptRadius of attemptRadii) {
        try {
          rawPlaces = await fetchNearbyPlaces(
            midpoint.lat,
            midpoint.lng,
            attemptRadius,
            type
          );
          if (rawPlaces.length > 0) break;
        } catch (attemptErr: any) {
          console.warn(
            `Overpass attempt failed at radius ${attemptRadius}km:`,
            attemptErr?.message || attemptErr
          );
        }
      }

      if (rawPlaces.length === 0) {
        const fallbackRadius = Math.min(Math.max(radius * 2, radius + 5), 20);
        if (fallbackRadius > radius) {
          try {
            rawPlaces = await fetchNearbyPlaces(
              midpoint.lat,
              midpoint.lng,
              fallbackRadius,
              type
            );
          } catch (fallbackErr: any) {
            console.error("Overpass fallback failed:", fallbackErr.message);
          }
        }
      }

      if (rawPlaces.length === 0) {
        io.to(code).emit("places:results", {
          places: [],
          midpoint,
        });
        return res.json({ places: [], midpoint });
      }

      const places = scorePlaces(rawPlaces, trip.friends, type, midpoint);
      const currentPlaceIds = new Set(places.map((place) => String(place.id)));
      trip.places = places;
      trip.midpoint = midpoint;
      trip.votes = Object.fromEntries(
        Object.entries(trip.votes ?? {}).filter(([placeId]) => currentPlaceIds.has(placeId))
      );
      if (trip.confirmedPlaceId && !currentPlaceIds.has(String(trip.confirmedPlaceId))) {
        trip.confirmedPlaceId = undefined;
      }
      await saveTrip(trip);

      io.to(code).emit("places:results", { places, midpoint });
      return res.json({ places, midpoint });
    } catch (err: any) {
      console.error("Overpass error:", err.message);
      return res.status(502).json({ error: "Place search failed" });
    }
  });

  router.post("/:code/votes", requireAuth, async (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const placeId = Number(req.body?.placeId);
    const voterId = normalizeText(req.body?.voterId);
    const trip = await getTrip(code);

    if (!trip) return res.status(404).json({ error: "Trip not found" });
    if (!voterId || !Number.isFinite(placeId)) {
      return res.status(400).json({ error: "placeId and voterId are required" });
    }
    if (!trip.places?.some((place) => place.id === placeId)) {
      return res.status(404).json({ error: "Place not found in this trip" });
    }

    const votes = { ...(trip.votes ?? {}) };
    const placeKey = String(placeId);
    const alreadyVoted = (votes[placeKey] ?? []).includes(voterId);

    for (const key of Object.keys(votes)) {
      votes[key] = votes[key].filter((id) => id !== voterId);
      if (votes[key].length === 0) delete votes[key];
    }
    if (!alreadyVoted) votes[placeKey] = [...(votes[placeKey] ?? []), voterId];

    trip.votes = votes;
    await saveTrip(trip);
    io.to(code).emit("trip:state", { trip });
    return res.json({ trip });
  });

  router.post("/:code/confirm", requireAuth, async (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const placeId = Number(req.body?.placeId);
    const trip = await getTrip(code);

    if (!trip) return res.status(404).json({ error: "Trip not found" });
    if (!Number.isFinite(placeId) || !trip.places?.some((place) => place.id === placeId)) {
      return res.status(404).json({ error: "Place not found in this trip" });
    }

    trip.confirmedPlaceId = placeId;
    await saveTrip(trip);
    io.to(code).emit("trip:state", { trip });
    return res.json({ trip });
  });

  return router;
}
