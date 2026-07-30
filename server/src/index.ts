import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import { tripsRouter } from "./routes/trips";
import { geocodeRouter } from "./routes/geocode";
import { registerSocketHandlers } from "./socket/handlers";

const app = express();
const httpServer = createServer(app);
const clientUrl = (process.env.CLIENT_URL || "http://localhost:4200").trim().replace(/\/$/, "");
console.log("CORS CLIENT_URL loaded:", clientUrl);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Normalize the origin by removing trailing slash
      const normalizedOrigin = origin.replace(/\/$/, "");
      const normalizedClientUrl = clientUrl.replace(/\/$/, "");
      
      if (normalizedOrigin === normalizedClientUrl) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Normalize the origin by removing trailing slash
      const normalizedOrigin = origin.replace(/\/$/, "");
      const normalizedClientUrl = clientUrl.replace(/\/$/, "");
      
      if (normalizedOrigin === normalizedClientUrl) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api/trips", tripsRouter(io));
app.use("/api/geocode", geocodeRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Socket.IO
registerSocketHandlers(io);

const PORT = parseInt(process.env.PORT || "3000", 10);
httpServer.listen(PORT, () => {
  console.log(`🚀 MeetMidway server running on http://localhost:${PORT}`);
});
