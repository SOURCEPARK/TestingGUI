const { Pool } = require('pg')

const pool = new Pool({
  host: 'db', // Hostname des Datenbank-Containers (siehe docker-compose)
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB
});

module.exports = pool;