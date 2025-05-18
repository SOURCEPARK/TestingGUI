const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
  host: 'db', // Hostname des Datenbank-Containers (siehe docker-compose)
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
});

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`Datenbankzeit: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Fehler bei der DB-Verbindung');
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});

