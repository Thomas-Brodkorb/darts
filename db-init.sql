-- Run this SQL against your Darts database to create a simple Players table.
-- Adjust the schema to match the fields you want to store.

CREATE TABLE IF NOT EXISTS Players (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);



CREATE TABLE IF NOT EXISTS Legs (
  id serial PRIMARY KEY,
  player_one integer NOT NULL references Players(id) on delete cascade,
  player_two integer NOT NULL references Players(id) on delete cascade,
  "break" boolean NOT NULL,
  start_value integer NOT NULL,
  rounds integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS Visits (
  id serial PRIMARY KEY,
  player_id integer NOT NULL references Players(id) on delete cascade,
  leg_id integer references Legs(id) on delete set null,
  value integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table to store individual darts for a visit
CREATE TABLE IF NOT EXISTS Darts (
  id serial PRIMARY KEY,
  single_value integer NOT NULL,
  factor integer NOT NULL,
  visit integer NOT NULL references Visits(id) on delete cascade
);