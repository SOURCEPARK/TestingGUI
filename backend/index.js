import express from 'express';


const app = express();
const port = 3000;


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