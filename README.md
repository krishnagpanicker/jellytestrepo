# Jelly

Jelly is split into three application folders:

- `Data/` contains the PostgreSQL schema, migrations, and database utility SQL.
- `GoogleAuth/` contains the Express API and Jelly session authentication.
- `Mobile/` contains the Expo/React Native application.

## Database

Create the original schema only for a new database:

```sh
psql -d jelly_practice_auth -f Data/schema.sql
```

For an existing database, apply the username migration instead:

```sh
psql -d jelly_practice_auth -f Data/migrations/001_add_usernames.sql
```

The migration never deletes data. If duplicate `user_id` rows already exist in
`usernames`, it aborts and prints the duplicate IDs so they can be reviewed
manually before the unique constraint is added.

## Backend

Create `GoogleAuth/.env` with `GOOGLE_WEB_CLIENT_ID` and the PostgreSQL variables
used by `pg` (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` as
needed). Never commit that file.

```sh
cd GoogleAuth
npm ci
npm start
```

The API listens on `http://localhost:3000` by default.

## Mobile

The app remains on Expo SDK 58 and requires a development build for native
Google Sign-In. Set the API origin before starting Metro. A physical phone must
use the computer's LAN IP rather than `localhost`; an Android emulator normally
uses `http://10.0.2.2:3000`.

```sh
cd Mobile
npm ci
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3000 npm start -- --dev-client
```

To rebuild the existing native development app when needed:

```sh
cd Mobile
npm run ios
# or
npm run android
```

No native dependency was added for the Jelly UI, so this implementation alone
does not require Pods to be reinstalled or a development build to be rebuilt.
