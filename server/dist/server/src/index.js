"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env") });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const trips_1 = require("./routes/trips");
const geocode_1 = require("./routes/geocode");
const handlers_1 = require("./socket/handlers");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const clientUrl = (process.env.CLIENT_URL || "http://localhost:4200").trim();
console.log("CORS CLIENT_URL loaded:", clientUrl);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: clientUrl,
        methods: ["GET", "POST"],
        credentials: true,
    },
});
// Middleware
app.use((0, cors_1.default)({
    origin: clientUrl,
    credentials: true,
}));
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
// Routes
app.use("/api/trips", (0, trips_1.tripsRouter)(io));
app.use("/api/geocode", geocode_1.geocodeRouter);
// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
});
// Socket.IO
(0, handlers_1.registerSocketHandlers)(io);
const PORT = parseInt(process.env.PORT || "3000", 10);
httpServer.listen(PORT, () => {
    console.log(`🚀 MeetMidway server running on http://localhost:${PORT}`);
});
