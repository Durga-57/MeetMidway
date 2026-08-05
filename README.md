# MeetMidway

MeetMidway is a full-stack app for finding a fair meetup location between friends. The Angular client lives in `client/` and the Node/Socket.IO backend lives in `server/`.

## Local setup

1. Install dependencies from the repo root:

```bash
npm run install:all
```

2. Create local env files from the examples below and keep the real files out of git:

```bash
copy server\.env.example server\.env
```

3. Start the app:

```bash
npm run dev
```

The client runs on `http://localhost:4200` and the API on `http://localhost:3000` by default.

## Environment files

- `server/.env` is local only and is ignored by git.
- `client-react-backup/.env` is also local only and is ignored by git.
- If you add additional local config, use `.env.example` files and keep the real values out of the repo.

## Deployment notes

- Host both client and server behind HTTPS. Most platforms provide HTTPS automatically.
- Set the backend `CLIENT_URL` to the deployed frontend origin.
- Configure a persistent production `REDIS_URL` for the backend. The in-memory fallback is for local development only; it loses trips when the server restarts.
- For Vercel + Render, set the frontend build environment variables `MEETMIDWAY_API_URL` and `MEETMIDWAY_SOCKET_URL` to the Render backend URL, for example `https://your-render-service.onrender.com`. The client defaults to the current backend at `https://meetmidway.onrender.com` when these variables are omitted.
- Keep the backend `CLIENT_URL` pointed at the Vercel frontend origin so CORS and Socket.IO accept the browser app.
- The environment variables remain recommended for changing backend hosts; without them, production uses the current Render backend and local development uses `http://localhost:3000`.
- There is no login flow in this repo, so there are no passwords to store. If you add auth later, hash passwords before storage.

## Security and validation

- Trip names, participant names, addresses, and place categories are validated on both the client and server.
- The creator is added to the trip once at session creation, which avoids the old manual "Add me" loop.
- Error states are returned as friendly JSON messages instead of stack traces.

## Demo flow

1. Create a trip with your name and starting address.
2. Share the invite code or join link with others.
3. Add participants in the room and run a live place search to show the Socket.IO updates.
