import { Injectable, NgZone } from "@angular/core";
import { io, Socket } from "socket.io-client";
import { environment } from "../../environments/environment";
import { TripStoreService } from "./trip-store.service";
import { Trip, Friend, ScoredPlace, Midpoint } from "@shared/types";

@Injectable({
  providedIn: "root",
})
export class SocketService {
  private socket: Socket | null = null;
  private socketUrl = environment.socketUrl;

  constructor(
    private store: TripStoreService,
    private ngZone: NgZone
  ) {}

  joinRoom(code: string) {
    console.log("SocketService: joinRoom called for code", code, "socketUrl =", this.socketUrl);
    if (!this.socket) {
      console.log("SocketService: creating socket instance");
      this.socket = io(this.socketUrl, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
      });

      this.socket.on("connect", () => {
        this.ngZone.run(() => {
          console.log("SocketService: socket connected! id =", this.socket?.id);
        });
      });

      this.socket.on("connect_error", (err) => {
        this.ngZone.run(() => {
          console.error("SocketService: socket connection error", err);
        });
      });

      this.socket.on("disconnect", (reason) => {
        this.ngZone.run(() => {
          console.log("SocketService: socket disconnected! reason =", reason);
        });
      });
    }

    this.socket.off("trip:state");
    this.socket.off("friend:joined");
    this.socket.off("friend:left");
    this.socket.off("places:results");
    this.socket.off("trip:error");

    this.socket.on("trip:error", ({ error }: { error: string }) => {
      this.ngZone.run(() => {
        console.error("SocketService: trip error", error);
      });
    });

    console.log("SocketService: emitting room:join");
    this.socket.emit("room:join", { code });

    // Set up event listeners
    this.socket.on("trip:state", ({ trip }: { trip: Trip }) => {
      this.ngZone.run(() => {
        console.log("SocketService: received event trip:state", trip);
        this.store.setTrip(trip);
        if (trip.places && trip.midpoint) this.store.setPlaces(trip.places, trip.midpoint);
      });
    });

    this.socket.on("friend:joined", ({ friends }: { friends: Friend[] }) => {
      this.ngZone.run(() => {
        console.log("SocketService: received event friend:joined", friends);
        this.store.updateFriends(friends);
      });
    });

    this.socket.on("friend:left", ({ friendId }: { friendId: string }) => {
      this.ngZone.run(() => {
        console.log("SocketService: received event friend:left", friendId);
        this.store.removeFriendLocally(friendId);
      });
    });

    this.socket.on(
      "places:results",
      ({
        places,
        midpoint,
      }: {
        places: ScoredPlace[];
        midpoint: Midpoint;
      }) => {
        this.ngZone.run(() => {
          console.log("SocketService: received event places:results", places, midpoint);
          this.store.setPlaces(places, midpoint);
        });
      }
    );
  }

  leaveRoom() {
    if (this.socket) {
      this.socket.off("trip:state");
      this.socket.off("friend:joined");
      this.socket.off("friend:left");
      this.socket.off("places:results");
      this.socket.off("trip:error");
    }
  }
}
