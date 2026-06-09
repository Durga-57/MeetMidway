"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocodeRouter = void 0;
const express_1 = require("express");
exports.geocodeRouter = (0, express_1.Router)();
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "MeetMidway/1.0";
exports.geocodeRouter.get("/", async (req, res) => {
    const q = req.query.q;
    if (!q || q.trim().length < 3) {
        return res.status(400).json({ error: "Query too short" });
    }
    try {
        const params = new URLSearchParams({
            format: "json",
            q: q.trim(),
            limit: "5",
            addressdetails: "1",
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
            console.error(`Nominatim returned ${response.status}: ${response.statusText}`);
            return res.status(502).json({ error: "Geocoding service returned an error" });
        }
        const data = (await response.json());
        const results = data.map((r) => ({
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
            display_name: r.display_name,
        }));
        return res.json(results);
    }
    catch (err) {
        console.error("Geocode error:", err.message || err);
        return res.status(502).json({ error: "Geocoding service unavailable" });
    }
});
