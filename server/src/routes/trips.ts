import { Router, Request, Response } from "express";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { Trip, PlaceType, Friend, FRIEND_COLORS } from "../../../shared/types";
import { getTrip, saveTrip } from "../services/redis";
import { computeMidpoint, scorePlaces } from "../services/scoring";
import { fetchNearbyPlaces } from "../services/overpass";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "MeetMidway/1.0";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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

export function tripsRouter(io: Server): Router {
  const router = Router();

  // POST /api/trips — create a new trip
  router.post("/", async (req: Request, res: Response) => {
    const { name, placeType } = req.body as {
      name?: string;
      placeType?: PlaceType;
    };

    if (!name || !placeType) {
      return res.status(400).json({ error: "name and placeType are required" });
    }

    let code = generateCode();
    // Ensure unique code
    while (await getTrip(code)) {
      code = generateCode();
    }

    const now = Date.now();
    const trip: Trip = {
      code,
      name: name.trim(),
      placeType,
      friends: [],
      createdAt: now,
      expiresAt: now + 86400 * 1000,
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
  router.post("/:code/friends", async (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { name, address } = req.body as { name?: string; address?: string };

    if (!name || !address) {
      return res.status(400).json({ error: "name and address are required" });
    }

    const trip = await getTrip(code);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    // Geocode on server
    const coords = await geocodeAddress(address);
    if (!coords) {
      return res.status(422).json({ error: "Address not found" });
    }

    // Deduplicate name
    let friendName = name.trim();
    const existingNames = trip.friends.map((f) => f.name);
    if (existingNames.includes(friendName)) {
      let counter = 2;
      while (existingNames.includes(`${friendName} ${counter}`)) counter++;
      friendName = `${friendName} ${counter}`;
    }

    const color = FRIEND_COLORS[trip.friends.length % FRIEND_COLORS.length];
    const friend: Friend = {
      id: uuidv4(),
      name: friendName,
      address: address.trim(),
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
  router.post("/:code/search", async (req: Request, res: Response) => {
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
      const rawPlaces = await fetchNearbyPlaces(
        midpoint.lat,
        midpoint.lng,
        radius,
        type
      );

      if (rawPlaces.length === 0) {
        io.to(code).emit("places:results", {
          places: [],
          midpoint,
        });
        return res.json({ places: [], midpoint });
      }

      const places = scorePlaces(rawPlaces, trip.friends, type);

      io.to(code).emit("places:results", { places, midpoint });
      return res.json({ places, midpoint });
    } catch (err: any) {
      console.error("Overpass error:", err.message);
      return res.status(502).json({ error: "Place search failed" });
    }
  });

  return router;
}
