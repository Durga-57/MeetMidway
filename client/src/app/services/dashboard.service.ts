import { Injectable } from "@angular/core";

export type DashboardActivityType = "created" | "joined" | "voted";

export interface DashboardActivity {
  id: string;
  type: DashboardActivityType;
  title: string;
  tripCode: string;
  tripName: string;
  participantCount: number;
  createdAt: number;
}

export interface DashboardSnapshot {
  activities: DashboardActivity[];
  totalTrips: number;
  totalFriends: number;
  activeTrips: number;
  placesVoted: number;
}

@Injectable({ providedIn: "root" })
export class DashboardService {
  private readonly storagePrefix = "meetmidway-dashboard:";

  record(userId: string, activity: Omit<DashboardActivity, "id" | "createdAt">): void {
    if (!userId || typeof localStorage === "undefined") return;

    const activities = this.read(userId);
    activities.unshift({
      ...activity,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    });
    this.write(userId, activities.slice(0, 30));
  }

  snapshot(userId: string): DashboardSnapshot {
    const activities = this.read(userId);
    const tripCodes = new Set(activities.map((activity) => activity.tripCode));
    const votedActivities = activities.filter((activity) => activity.type === "voted");
    const activeTripCodes = new Set(
      activities
        .filter((activity) => Date.now() - activity.createdAt < 86400 * 1000)
        .map((activity) => activity.tripCode)
    );

    return {
      activities,
      totalTrips: tripCodes.size,
      totalFriends: activities.reduce((max, activity) => Math.max(max, activity.participantCount), 0),
      activeTrips: activeTripCodes.size,
      placesVoted: votedActivities.length,
    };
  }

  private read(userId: string): DashboardActivity[] {
    if (!userId || typeof localStorage === "undefined") return [];

    try {
      const value = JSON.parse(localStorage.getItem(this.storagePrefix + userId) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  private write(userId: string, activities: DashboardActivity[]): void {
    try {
      localStorage.setItem(this.storagePrefix + userId, JSON.stringify(activities));
    } catch {
      // Dashboard history is optional; a blocked storage context should not interrupt trips.
    }
  }
}
