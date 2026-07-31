# Supabase setup and migration

## 1. Run the database schema

Open **Supabase Dashboard → SQL Editor → New query**, paste `schema.sql`, and run it.

This creates profiles, trips, participants, searched places, votes, indexes, the profile trigger, and RLS policies. The policies assume every participant is linked to an authenticated Supabase user through `user_id`.

## 2. Enable Email authentication

Open **Authentication → Providers → Email** and enable it.

Recommended settings for development:

- Enable email provider.
- Enable email confirmations if you want verified accounts.
- Configure your SMTP sender before production; Supabase's default email service is limited.

Add these redirect URLs under **Authentication → URL Configuration → Redirect URLs**:

- `http://localhost:4200/auth/callback`
- `https://YOUR_PRODUCTION_DOMAIN/auth/callback`

## 3. Enable Google authentication

1. Open Google Cloud Console → **APIs & Services → Credentials**.
2. Create an **OAuth client ID** with application type **Web application**.
3. Add your local and production app origins under **Authorized JavaScript origins**:
   - `http://localhost:4200`
   - `https://YOUR_PRODUCTION_DOMAIN`
4. In Supabase, open **Authentication → Providers → Google** and enable it.
5. Copy the Supabase-provided callback URL shown in the Google provider panel into Google Cloud Console under **Authorized redirect URIs**. It will look like:
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
6. Paste the Google client ID and client secret into Supabase and save.

The browser only uses the Supabase project URL and anon/publishable key. Never expose the service-role key.

## 4. Migrate Redis trip data

The current server stores each trip as one Redis JSON value under `trip:<CODE>`. The target schema is normalized into four tables. Migration should be run once while the app is in maintenance mode:

1. Stop writes to the current app.
2. Export Redis data:

   ```bash
   redis-cli --scan --pattern 'trip:*' | ForEach-Object { redis-cli GET $_ }
   ```

   On Linux/macOS, use:

   ```bash
   redis-cli --scan --pattern 'trip:*' | while read key; do redis-cli --raw GET "$key"; done > trips.jsonl
   ```

3. Transform each Redis trip into:
   - one `public.trips` row;
   - one `public.trip_participants` row per `friends[]` item;
   - one `public.trip_places` row per `places[]` item;
   - one `public.trip_votes` row for each `votes[placeId][]` entry.
4. Convert Redis's `createdAt` and `expiresAt` milliseconds with `to_timestamp(value / 1000.0)`.
5. Resolve each participant's `user_id` from your account mapping. Do not invent a UUID: if old anonymous participants have no account, keep `user_id` null and require them to rejoin after migration.
6. Import the transformed rows using the Supabase dashboard CSV importer, `psql`, or a one-time server script using the service-role key on the server only.
7. Update the server routes to read/write Supabase tables, verify the migrated trip count, then re-enable writes.

The current Redis API and the new Supabase schema are not interchangeable automatically; the application service layer still needs to be switched from `getTrip`/`saveTrip` to Supabase queries. Keep Redis available until that cutover is verified.
