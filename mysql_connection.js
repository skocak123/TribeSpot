const express = require('express');
const path = require('path');
let mysql = require('mysql2');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.DB_WACHTWOORD,
  database: "tribespot"
});

app.get('/api/statussen', (req, res) => {
  const sql = `SELECT gebruikers.naam, lokalen.naam AS lokaal, lokalen.verdieping, statussen.plek,
    statussen.werkt_aan, statussen.beschikbaarheid, TIME_FORMAT(statussen.tot, '%H:%i') AS tot
    FROM statussen
    JOIN gebruikers ON statussen.gebruiker_id = gebruikers.id
    JOIN lokalen ON statussen.lokaal_id = lokalen.id`;

  db.query(sql, (err, rows) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ fout: 'Er ging iets mis met de database.' });
    }
    res.json(rows);
  });
});

app.get('/api/online', async (req, res) => {
  try {
    const [online] = await db.promise().query('SELECT naam FROM gebruikers WHERE id IN (SELECT gebruiker_id FROM statussen) ORDER BY naam');
    const [offline] = await db.promise().query('SELECT naam FROM gebruikers WHERE id NOT IN (SELECT gebruiker_id FROM statussen) ORDER BY naam');
    res.json({ online: online, offline: offline });
  } catch (err) {
    console.log(err);
    res.status(500).json({ fout: 'Er ging iets mis met de database.' });
  }
});

const mijnGebruikerId = 7;

app.post('/api/statussen', async (req, res) => {
  const { lokaal, plek, werkt_aan, beschikbaarheid, tot } = req.body;

  if (!lokaal || !plek || !beschikbaarheid || !tot) {
    return res.status(400).json({ fout: 'Niet alles is ingevuld.' });
  }

  try {
    const [lokalen] = await db.promise().query('SELECT id FROM lokalen WHERE naam = ?', [lokaal]);
    if (lokalen.length === 0) {
      return res.status(404).json({ fout: 'Dit lokaal bestaat niet.' });
    }
    const lokaalId = lokalen[0].id;

    const [bezet] = await db.promise().query(
      'SELECT id FROM statussen WHERE lokaal_id = ? AND plek = ? AND gebruiker_id != ?',
      [lokaalId, plek, mijnGebruikerId]
    );
    if (bezet.length > 0) {
      return res.status(409).json({ fout: 'Deze plek is al bezet.' });
    }

    await db.promise().query('DELETE FROM statussen WHERE gebruiker_id = ?', [mijnGebruikerId]);
    await db.promise().query(
      'INSERT INTO statussen (gebruiker_id, lokaal_id, werkt_aan, beschikbaarheid, tot, plek) VALUES (?, ?, ?, ?, ?, ?)',
      [mijnGebruikerId, lokaalId, werkt_aan, beschikbaarheid, tot, plek]
    );
    res.json({ gelukt: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ fout: 'Er ging iets mis met de database.' });
  }
});

app.delete('/api/statussen', async (req, res) => {
  try {
    await db.promise().query('DELETE FROM statussen WHERE gebruiker_id = ?', [mijnGebruikerId]);
    res.json({ gelukt: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ fout: 'Er ging iets mis met de database.' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
} )