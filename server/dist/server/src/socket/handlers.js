"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSocketHandlers = registerSocketHandlers;
const redis_1 = require("../services/redis");
function registerSocketHandlers(io) {
    io.on("connection", (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);
        socket.on("room:join", async ({ code }) => {
            const upperCode = code.toUpperCase();
            socket.join(upperCode);
            console.log(`📍 Socket ${socket.id} joined room ${upperCode}`);
            const trip = await (0, redis_1.getTrip)(upperCode);
            if (trip) {
                socket.emit("trip:state", { trip });
            }
            else {
                socket.emit("trip:error", { error: "Trip not found" });
            }
        });
        socket.on("disconnect", () => {
            console.log(`🔌 Socket disconnected: ${socket.id}`);
        });
    });
}
