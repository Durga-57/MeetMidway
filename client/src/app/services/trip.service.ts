import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { Trip, Friend, ScoredPlace, PlaceType } from "@shared/types";

@Injectable({
  providedIn: "root",
})
export class TripService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createTrip(
    name: string,
    placeType: PlaceType,
    creatorName: string,
    creatorAddress: string
  ): Observable<{ code: string; trip: Trip }> {
    return this.http.post<{ code: string; trip: Trip }>(`${this.api}/api/trips`, {
      name,
      placeType,
      creatorName,
      creatorAddress,
    });
  }

  fetchTrip(code: string): Observable<{ trip: Trip }> {
    return this.http.get<{ trip: Trip }>(`${this.api}/api/trips/${code}`);
  }

  addFriend(code: string, name: string, address: string): Observable<{ friend: Friend; trip: Trip }> {
    return this.http.post<{ friend: Friend; trip: Trip }>(`${this.api}/api/trips/${code}/friends`, { name, address });
  }

  removeFriend(code: string, friendId: string): Observable<{ trip: Trip }> {
    return this.http.delete<{ trip: Trip }>(`${this.api}/api/trips/${code}/friends/${friendId}`);
  }

  searchPlaces(code: string, placeType: PlaceType, radiusKm: number): Observable<{ places: ScoredPlace[]; midpoint: { lat: number; lng: number } }> {
    return this.http.post<{ places: ScoredPlace[]; midpoint: { lat: number; lng: number } }>(
      `${this.api}/api/trips/${code}/search`,
      { placeType, radiusKm }
    );
  }
}
