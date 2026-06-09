import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useTripStore } from "../store/tripStore";
import { Friend, ScoredPlace, Trip } from "@shared/types";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

let socketInstance: Socket | null = null;

export function useSocket(code: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const { updateFriends, removeFriendLocally, setPlaces, setTrip } =
    useTripStore();

  useEffect(() => {
    if (!code) return;

    // Reuse or create socket
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
      });
    }

    socketRef.current = socketInstance;
    const socket = socketRef.current;

    socket.emit("room:join", { code });

    socket.on("trip:state", ({ trip }: { trip: Trip }) => {
      setTrip(trip);
    });

    socket.on("friend:joined", ({ friends }: { friends: Friend[] }) => {
      updateFriends(friends);
    });

    socket.on("friend:left", ({ friendId }: { friendId: string }) => {
      removeFriendLocally(friendId);
    });

    socket.on(
      "places:results",
      ({
        places,
        midpoint,
      }: {
        places: ScoredPlace[];
        midpoint: { lat: number; lng: number };
      }) => {
        setPlaces(places, midpoint);
      }
    );

    return () => {
      socket.off("trip:state");
      socket.off("friend:joined");
      socket.off("friend:left");
      socket.off("places:results");
    };
  }, [code]);
}
