# MeetMidway

> A fairer way to decide where everyone should meet.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-meet--midway--nu.vercel.app-2563eb?style=flat-square)](https://meet-midway-nu.vercel.app/)

MeetMidway helps groups find a meetup location that works for everyone. Participants share their starting points, the app calculates a balanced midpoint, recommends nearby places, and gives the group a simple voting workspace to make the final decision together.

## Live Demo

**Try the app:** [meet-midway-nu.vercel.app](https://meet-midway-nu.vercel.app/)

## Why MeetMidway?

Choosing a place for a group often becomes a compromise driven by whoever speaks first. MeetMidway makes the trade-offs visible by ranking places according to how fairly the group can reach them.

## Core Features

- Create a trip and share it with an invite code or join link.
- Add participant names and starting addresses.
- Visualize participant locations and the calculated midpoint on a map.
- Search nearby restaurants, cafés, cinemas, parks, bars, museums, and more.
- Rank recommendations using travel fairness and midpoint proximity.
- Vote on places with live group updates.
- Preserve trip state with persistent Redis storage in production.
- Provide validation and clear error states across the client and API.

## Technical Highlight

Recommendations are ranked with a fairness score that considers each participant’s travel distance, the maximum distance in the group, the spread between participants, and the venue’s distance from the calculated midpoint. Search results and voting updates are synchronized through Socket.IO so every participant sees the same decision state in real time.

## Tech Stack

**Frontend:** Angular, TypeScript, RxJS, Leaflet
**Backend:** Node.js, Express, TypeScript, Socket.IO
**Data and maps:** Redis, OpenStreetMap, Nominatim, Overpass API

## Local Setup

Install dependencies from the repository root:

```bash
npm run install:all
```

Create the local server environment file:

```bash
copy server\.env.example server\.env
```

Start the client and API:

```bash
npm run dev
```

The client runs on `http://localhost:4200` and the API runs on `http://localhost:3000` by default.

## Demo Flow

1. Create a trip with your name and starting address.
2. Share the invite code or join link with friends.
3. Add the group’s starting points.
4. Choose a category and search radius.
5. Review the ranked recommendations and vote together.

## Deployment Notes

- Host the client and server behind HTTPS.
- Set the backend `CLIENT_URL` to the deployed frontend origin.
- Configure a persistent production `REDIS_URL`; the in-memory fallback is intended only for local development.
- For a Vercel frontend and Render backend, set `MEETMIDWAY_API_URL` and `MEETMIDWAY_SOCKET_URL` to the backend URL.
