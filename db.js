import postgres from 'postgres'

// Use a connection string or a config object to connect to PostgreSQL.
// Adjust the username/password/host/port/database values as needed.
const sql = postgres('postgres://postgres:manager@localhost:5432/Darts', {
  host: 'localhost',
  port: 5432,
  database: 'Darts',
  username: 'postgres',
  password: 'manager',
})

export default sql

