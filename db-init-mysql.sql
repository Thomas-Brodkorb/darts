-- Run this SQL against your Darts database to create a simple Players table.
-- Adjust the schema to match the fields you want to store.

CREATE TABLE IF NOT EXISTS Players (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS Legs (
  id serial PRIMARY KEY,
  player_one bigint unsigned NOT NULL references Players(id) on delete cascade,
  player_two bigint unsigned NOT NULL references Players(id) on delete cascade,
  break boolean NOT NULL,
  start_value integer NOT NULL,
  rounds integer NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Visits (
  id serial PRIMARY KEY,
  player_id bigint unsigned NOT NULL references Players(id) on delete cascade,
  leg_id bigint unsigned references Legs(id) on delete set null,
  value integer NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table to store individual darts for a visit
CREATE TABLE IF NOT EXISTS Darts (
  id serial PRIMARY KEY,
  single_value integer NOT NULL,
  factor integer NOT NULL,
  visit bigint unsigned NOT NULL references Visits(id) on delete cascade
);

-- Table to store trainings per player
CREATE TABLE IF NOT EXISTS Trainings (
  id serial PRIMARY KEY,
  player bigint unsigned NOT NULL references Players(id) on delete cascade,
  rounds integer NOT NULL,
  start_value integer NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);