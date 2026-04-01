# Darts Postgres Example

This project demonstrates a simple full-stack flow:

- A **static HTML page** (`public/stats.html`) that sends a JSON object to the server.
- A **Node.js Express server** (`server.js`) that receives the object via `POST /api/players` and inserts it into a **Postgres** table.
- The server also exposes `GET /api/players` to read data from the database.

## Setup

1. Make sure Postgres is running and reachable at `localhost:5432`.
2. Ensure the database `Darts` exists and has a `Players` table.

You can create the table using the provided `db-init.sql`:

```bash
psql -d Darts -f db-init.sql
```

Example `Players` table schema (adjust as needed):

```sql
create table if not exists Players (
  id serial primary key,
  name text not null,
  email text not null,
  score int not null default 0,
  created_at timestamptz not null default now()
);
```

Example `Visits` table schema (used by the web UI when recording a visit):

```sql
create table if not exists Visits (
  id serial primary key,
  player_id integer not null references Players(id) on delete cascade,
  leg_id integer references Legs(id) on delete set null,
  value integer not null,
  created_at timestamptz not null default now()
);
```

Example `Legs` table schema (tracks legs between two players):

```sql
create table if not exists Legs (
  id serial primary key,
  player_one integer not null references Players(id) on delete cascade,
  player_two integer not null references Players(id) on delete cascade,
  "break" boolean not null,
  start_value integer not null,
  rounds integer not null,
  created_at timestamptz not null default now()
);
```

### API endpoints

- `GET /api/players` — list players
- `POST /api/players` — create a player
- `GET /api/visits` — list visits (joined with player name)
- `POST /api/visits` — create a visit (requires `player_id` + `value`)
- `GET /api/legs` — list legs (joined with player names)
- `POST /api/legs` — create a leg (requires `player_one`, `player_two`, `break`, `rounds`)

3. Install dependencies:

```bash
cd /Users/thomasbrodkorb/Development/darts
npm install
```

4. Start the server:

```bash
npm start
```

5. Open the app in your browser:

```
http://localhost:3000
```

## Changing the table/fields

- Update the `Players` table schema in Postgres.
- Update the fields used in `public/app.js` (form + object keys).
- Update the insert logic in `server.js` if you need to insert into a different table or with different column names.
