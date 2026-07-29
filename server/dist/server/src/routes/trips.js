"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tripsRouter = tripsRouter;
const express_1 = require("express");
const uuid_1 = require("uuid");
const types_1 = require("../../../shared/types");
const redis_1 = require("../services/redis");
const scoring_1 = require("../services/scoring");
const overpass_1 = require("../services/overpass");
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "MeetMidway/1.0";
function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function normalizeText(value) {
    return typeof value === "string" ? value.trim() : "";
}
function isValidPlaceType(value) {
    return typeof value === "string" && value in types_1.PLACE_TYPE_LABELS;
}
async function geocodeAddress(address) {
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
        const data = (await response.json());
        if (!data.length)
            return null;
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    catch (err) {
        console.error("geocodeAddress error:", err.message || err);
        return null;
    }
}
async function buildFriend(name, address, colorIndex) {
    const coords = await geocodeAddress(address);
    if (!coords)
        return null;
    return {
        id: (0, uuid_1.v4)(),
        name,
        address,
        lat: coords.lat,
        lng: coords.lng,
        color: types_1.FRIEND_COLORS[colorIndex % types_1.FRIEND_COLORS.length],
        joinedAt: Date.now(),
    };
}
function tripsRouter(io) {
    const router = (0, express_1.Router)();
    // POST /api/trips — create a new trip
    router.post("/", async (req, res) => {
        const { name, placeType } = req.body;
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
        if (creatorAddress.length < 3 || creatorAddress.length > 120) {
            return res.status(400).json({ error: "Creator address must be between 3 and 120 characters" });
        }
        let code = generateCode();
        // Ensure unique code
        while (await (0, redis_1.getTrip)(code)) {
            code = generateCode();
        }
        const now = Date.now();
        const creator = await buildFriend(creatorName, creatorAddress, 0);
        if (!creator) {
            return res.status(422).json({ error: "Creator address not found" });
        }
        const trip = {
            code,
            name: tripName,
            placeType,
            friends: [creator],
            createdAt: now,
            expiresAt: now + 86400 * 1000,
        };
        await (0, redis_1.saveTrip)(trip);
        return res.status(201).json({ code, trip });
    });
    // GET /api/trips/:code — fetch trip
    router.get("/:code", async (req, res) => {
        const trip = await (0, redis_1.getTrip)(req.params.code.toUpperCase());
        if (!trip)
            return res.status(404).json({ error: "Trip not found" });
        return res.json({ trip });
    });
    // POST /api/trips/:code/friends — add a friend
    router.post("/:code/friends", async (req, res) => {
        const code = req.params.code.toUpperCase();
        const { name, address } = req.body;
        const friendName = normalizeText(name);
        const friendAddress = normalizeText(address);
        if (!friendName || !friendAddress) {
            return res.status(400).json({ error: "name and address are required" });
        }
        if (friendName.length < 2 || friendName.length > 40) {
            return res.status(400).json({ error: "Name must be between 2 and 40 characters" });
        }
        if (friendAddress.length < 3 || friendAddress.length > 120) {
            return res.status(400).json({ error: "Address must be between 3 and 120 characters" });
        }
        const trip = await (0, redis_1.getTrip)(code);
        if (!trip)
            return res.status(404).json({ error: "Trip not found" });
        const coords = await geocodeAddress(friendAddress);
        if (!coords) {
            return res.status(422).json({ error: "Address not found" });
        }
        // Deduplicate name
        let dedupedFriendName = friendName;
        const existingNames = trip.friends.map((f) => f.name);
        if (existingNames.includes(dedupedFriendName)) {
            let counter = 2;
            while (existingNames.includes(`${dedupedFriendName} ${counter}`))
                counter++;
            dedupedFriendName = `${dedupedFriendName} ${counter}`;
        }
        const color = types_1.FRIEND_COLORS[trip.friends.length % types_1.FRIEND_COLORS.length];
        const friend = {
            id: (0, uuid_1.v4)(),
            name: dedupedFriendName,
            address: friendAddress,
            lat: coords.lat,
            lng: coords.lng,
            color,
            joinedAt: Date.now(),
        };
        trip.friends.push(friend);
        await (0, redis_1.saveTrip)(trip);
        // Emit to room
        io.to(code).emit("friend:joined", { friends: trip.friends });
        return res.status(201).json({ friend, trip });
    });
    // DELETE /api/trips/:code/friends/:friendId — remove a friend
    router.delete("/:code/friends/:friendId", async (req, res) => {
        const code = req.params.code.toUpperCase();
        const { friendId } = req.params;
        const trip = await (0, redis_1.getTrip)(code);
        if (!trip)
            return res.status(404).json({ error: "Trip not found" });
        const before = trip.friends.length;
        trip.friends = trip.friends.filter((f) => f.id !== friendId);
        if (trip.friends.length === before) {
            return res.status(404).json({ error: "Friend not found" });
        }
        await (0, redis_1.saveTrip)(trip);
        io.to(code).emit("friend:left", { friendId });
        return res.json({ trip });
    });
    // POST /api/trips/:code/search — find places
    router.post("/:code/search", async (req, res) => {
        const code = req.params.code.toUpperCase();
        const { placeType, radiusKm } = req.body;
        const trip = await (0, redis_1.getTrip)(code);
        if (!trip)
            return res.status(404).json({ error: "Trip not found" });
        if (trip.friends.length < 2) {
            return res
                .status(400)
                .json({ error: "Need at least 2 friends to search" });
        }
        const type = placeType || trip.placeType;
        const radius = radiusKm || 5;
        const midpoint = (0, scoring_1.computeMidpoint)(trip.friends);
        try {
            const attemptRadii = [radius, Math.min(Math.max(radius * 1.5, radius + 2), 20)];
            let rawPlaces = [];
            for (const attemptRadius of attemptRadii) {
                try {
                    rawPlaces = await (0, overpass_1.fetchNearbyPlaces)(midpoint.lat, midpoint.lng, attemptRadius, type);
                    if (rawPlaces.length > 0)
                        break;
                }
                catch (attemptErr) {
                    console.warn(`Overpass attempt failed at radius ${attemptRadius}km:`, attemptErr?.message || attemptErr);
                }
            }
            if (rawPlaces.length === 0) {
                const fallbackRadius = Math.min(Math.max(radius * 2, radius + 5), 20);
                if (fallbackRadius > radius) {
                    try {
                        rawPlaces = await (0, overpass_1.fetchNearbyPlaces)(midpoint.lat, midpoint.lng, fallbackRadius, type);
                    }
                    catch (fallbackErr) {
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
            const places = (0, scoring_1.scorePlaces)(rawPlaces, trip.friends, type, midpoint);
            io.to(code).emit("places:results", { places, midpoint });
            return res.json({ places, midpoint });
        }
        catch (err) {
            console.error("Overpass error:", err.message);
            return res.status(502).json({ error: "Place search failed" });
        }
    });
    return router;
}
