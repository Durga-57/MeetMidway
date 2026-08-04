import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, of } from "rxjs";
import { catchError, finalize, map } from "rxjs/operators";
import { environment } from "../../environments/environment";
import { AuthService } from "./auth.service";

export interface GeoResult {
  lat: number;
  lng: number;
  display_name: string;
}

@Injectable({
  providedIn: "root",
})
export class GeocoderService {
  private api = environment.apiUrl;

  private suggestionsSubject = new BehaviorSubject<GeoResult[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  suggestions$ = this.suggestionsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) {}

  async search(query: string) {
    if (query.length < 3) {
      this.suggestionsSubject.next([]);
      return;
    }

    const token = await this.auth.getAccessToken();
    if (!token) {
      this.suggestionsSubject.next([]);
      return;
    }

    this.loadingSubject.next(true);
    this.http
      .get<GeoResult[]>(`${this.api}/api/geocode?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .pipe(
        map((results) => results.slice(0, 5)),
        catchError(() => of([])),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe((results) => {
        this.suggestionsSubject.next(results);
      });
  }

  clear() {
    this.suggestionsSubject.next([]);
  }
}
