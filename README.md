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
- Keep Socket.IO and API traffic on the same HTTPS origin or a trusted proxy path so the live room updates work in production.
- There is no login flow in this repo, so there are no passwords to store. If you add auth later, hash passwords before storage.

## Security and validation

- Trip names, participant names, addresses, and place categories are validated on both the client and server.
- The creator is added to the trip once at session creation, which avoids the old manual "Add me" loop.
- Error states are returned as friendly JSON messages instead of stack traces.

## Demo flow

1. Create a trip with your name and starting address.
2. Share the invite code or join link with others.
3. Add participants in the room and run a live place search to show the Socket.IO updates.
