# Darts

This project demonstrates a simple full-stack flow:

- A **static HTML page** (`public/stats.html`) that sends a JSON object to the server.
- A **Node.js Express server** (`server.js`) that receives the object via `POST /api/players` and inserts it into a database.
- The server also exposes `GET /api/players` to read data from the database.

## Setup

1. Install dependencies with `npm install`.
2. Start either PostgreSQL or MySQL and create the database and tables using the matching initialization script:

   - PostgreSQL: `psql -d Darts -f db-init.sql`
   - MySQL: select the `darts` database, then run `db-init-mysql.sql` (for example, `mysql -u root -p darts < db-init-mysql.sql`).

3. Configure the connection using environment variables. PostgreSQL is the default:

   ```bash
   export DB_CLIENT=postgres
   export PGHOST=localhost
   export PGPORT=5432
   export PGDATABASE=Darts
   export PGUSER=postgres
   export PGPASSWORD=your-postgres-password
   ```

   Or select MySQL and configure its connection:

   ```bash
   export DB_CLIENT=mysql
   export MYSQL_HOST=localhost
   export MYSQL_PORT=3306
   export MYSQL_DATABASE=darts
   export MYSQL_USER=root
   export MYSQL_PASSWORD=your-mysql-password
   ```

   `DATABASE_URL` can be used instead of the individual PostgreSQL settings. Do not commit passwords; set these variables in your shell or local environment.

4. Configure HTTP Basic Authentication. Both settings are required:

   ```bash
   export BASIC_AUTH_USERNAME=Brodkorb
   export BASIC_AUTH_PASSWORD=your-chosen-password
   ```

   Keep the password out of source control. Basic Authentication should only be used over HTTPS when accessing the app over a network.

5. Start the server with `npm start` and open `http://localhost:3000`. Your browser will prompt you for the username and password.

### API endpoints

- `GET /api/players` — list players
- `POST /api/players` — create a player
- `GET /api/visits` — list visits (joined with player name)
- `POST /api/visits` — create a visit (requires `player_id` + `value`)
- `GET /api/legs` — list legs (joined with player names)
- `POST /api/legs` — create a leg (requires `player_one`, `player_two`, `break`, `rounds`)

## Changing the table/fields

- Update the `Players` table schema in your selected database.
- Update the fields used in `public/app.js` (form + object keys).
- Update the insert logic in `server.js` if you need to insert into a different table or with different column names.
