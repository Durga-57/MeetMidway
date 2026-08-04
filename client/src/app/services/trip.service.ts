import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { from, Observable, switchMap } from "rxjs";
import { environment } from "../../environments/environment";
import { Trip, Friend, ScoredPlace, PlaceType } from "@shared/types";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: "root",
})
export class TripService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  createTrip(
    name: string,
    placeType: PlaceType,
    creatorName: string,
    creatorAddress: string
  ): Observable<{ code: string; trip: Trip }> {
    return this.withAuthHeaders((headers) =>
      this.http.post<{ code: string; trip: Trip }>(
        `${this.api}/api/trips`,
        {
          name,
          placeType,
          creatorName,
          creatorAddress,
        },
        { headers }
      )
    );
  }

  fetchTrip(code: string): Observable<{ trip: Trip }> {
    return this.http.get<{ trip: Trip }>(`${this.api}/api/trips/${code}`);
  }

  addFriend(code: string, name: string, address: string): Observable<{ friend: Friend; trip: Trip }> {
    return this.withAuthHeaders((headers) =>
      this.http.post<{ friend: Friend; trip: Trip }>(`${this.api}/api/trips/${code}/friends`, { name, address }, { headers })
    );
  }

  removeFriend(code: string, friendId: string): Observable<{ trip: Trip }> {
    return this.withAuthHeaders((headers) =>
      this.http.delete<{ trip: Trip }>(`${this.api}/api/trips/${code}/friends/${friendId}`, { headers })
    );
  }

  searchPlaces(code: string, placeType: PlaceType, radiusKm: number): Observable<{ places: ScoredPlace[]; midpoint: { lat: number; lng: number } }> {
    return this.withAuthHeaders((headers) =>
      this.http.post<{ places: ScoredPlace[]; midpoint: { lat: number; lng: number } }>(
        `${this.api}/api/trips/${code}/search`,
        { placeType, radiusKm },
        { headers }
      )
    );
  }

  voteForPlace(code: string, placeId: number, voterId: string): Observable<{ trip: Trip }> {
    return this.withAuthHeaders((headers) =>
      this.http.post<{ trip: Trip }>(`${this.api}/api/trips/${code}/votes`, { placeId, voterId }, { headers })
    );
  }

  confirmPlace(code: string, placeId: number): Observable<{ trip: Trip }> {
    return this.withAuthHeaders((headers) =>
      this.http.post<{ trip: Trip }>(`${this.api}/api/trips/${code}/confirm`, { placeId }, { headers })
    );
  }

  private withAuthHeaders<T>(request: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    return from(this.auth.getAccessToken()).pipe(
      switchMap((token) => {
        const headers = token
          ? new HttpHeaders({ Authorization: `Bearer ${token}` })
          : new HttpHeaders();
        return request(headers);
      })
    );
  }
}
