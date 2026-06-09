"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversine = haversine;
exports.computeMidpoint = computeMidpoint;
exports.scorePlaces = scorePlaces;
/** Convert degrees to radians */
function toRad(deg) {
    return (deg * Math.PI) / 180;
}
/** Convert radians to degrees */
function toDeg(rad) {
    return (rad * 180) / Math.PI;
}
/** Haversine distance in km */
function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
/** Spherical mean midpoint */
function computeMidpoint(friends) {
    if (friends.length === 0)
        return { lat: 0, lng: 0 };
    if (friends.length === 1)
        return { lat: friends[0].lat, lng: friends[0].lng };
    let x = 0, y = 0, z = 0;
    for (const f of friends) {
        const latR = toRad(f.lat);
        const lngR = toRad(f.lng);
        x += Math.cos(latR) * Math.cos(lngR);
        y += Math.cos(latR) * Math.sin(lngR);
        z += Math.sin(latR);
    }
    const n = friends.length;
    x /= n;
    y /= n;
    z /= n;
    const centralLng = Math.atan2(y, x);
    const centralSqrt = Math.sqrt(x * x + y * y);
    const centralLat = Math.atan2(z, centralSqrt);
    return { lat: toDeg(centralLat), lng: toDeg(centralLng) };
}
/** Clamp a value between min and max */
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}
/** Compute fairness score for a set of distances */
function fairnessScore(distances) {
    if (distances.length === 0)
        return 0;
    const avg = distances.reduce((a, b) => a + b, 0) / distances.length;
    if (avg === 0)
        return 100;
    const variance = distances.reduce((sum, d) => sum + (d - avg) ** 2, 0) / distances.length;
    const stdDev = Math.sqrt(variance);
    return clamp(100 - (stdDev / avg) * 50, 0, 100);
}
/** Score and rank places by fairness */
function scorePlaces(places, friends, placeType) {
    const scored = places.map((place) => {
        const distances = friends.map((f) => haversine(f.lat, f.lng, place.lat, place.lng));
        const avg = distances.reduce((a, b) => a + b, 0) / distances.length;
        const maxD = Math.max(...distances);
        const minD = Math.min(...distances);
        const score = fairnessScore(distances);
        return {
            id: place.id,
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            placeType,
            tags: place.tags,
            distances,
            avg,
            maxD,
            minD,
            fairnessScore: score,
        };
    });
    return scored
        .sort((a, b) => {
        const diff = b.fairnessScore - a.fairnessScore;
        if (Math.abs(diff) > 0.001)
            return diff;
        return a.avg - b.avg;
    })
        .slice(0, 8);
}
