import { Server, Socket } from "socket.io";
import { getTrip } from "../services/redis";

export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on("room:join", async ({ code }: { code: string }) => {
      const upperCode = code.toUpperCase();
      socket.join(upperCode);
      console.log(`📍 Socket ${socket.id} joined room ${upperCode}`);

      const trip = await getTrip(upperCode);
      if (trip) {
        socket.emit("trip:state", { trip });
      } else {
        socket.emit("trip:error", { error: "Trip not found" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
}
