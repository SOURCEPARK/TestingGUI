import db from '../config/db.js';

const { query } = db;

export async function getTime(req, res) {
  try {
    const result = await query('SELECT NOW()');
    res.send(`Datenbankzeit: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Fehler bei der DB-Verbindung');
  }
}