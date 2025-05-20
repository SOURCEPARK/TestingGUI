import db from '../config/db.js';

export const getTime = async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.send(`Datenbankzeit: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Fehler bei der DB-Verbindung');
  }
};

