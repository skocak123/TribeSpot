require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./database');
const session = require('express-session')

const app = express();
const POORT = 3000;

app.use(express.json());

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET ontbreekt in .env');
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

function alleenIngelogd(req, res, next) {
  if (!req.session.gebruikerId) {
    return res.redirect('/inloggen.html');
  }
  next();
}

const beveiligd = ['chat.html', 'profiel.html', 'kamer.html'];
beveiligd.forEach((pagina) => {
  app.get('/' + pagina, alleenIngelogd, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', pagina));
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/registreren', async (req, res) => {
  const { email, wachtwoord, naam, gebruikersnaam, studiejaar, tribe, interesses, helpen } = req.body;

  if (!email || !wachtwoord || !naam || !gebruikersnaam) {
    return res.status(400).json({ fout: 'Vul alle verplichte velden in.' });
  }
  if (!email.endsWith('@student.hu.nl')) {
    return res.status(400).json({ fout: 'Gebruik je HU-e-mailadres (@student.hu.nl).' });
  }
  if (wachtwoord.length < 8) {
    return res.status(400).json({ fout: 'Je wachtwoord moet minstens 8 tekens hebben.' });
  }
  if (![1, 2, 3, 4].includes(Number(studiejaar))) {
    return res.status(400).json({ fout: 'Kies een geldig studiejaar.' });
  }
  if (!['A', 'B', 'C'].includes(tribe)) {
    return res.status(400).json({ fout: 'Kies een tribe.' });
  }

  const toegestaan = ['Games', 'Muziek', 'Sport', 'Design', 'Code'];
  const schoneInteresses = (Array.isArray(interesses) ? interesses : [])
    .filter((i) => toegestaan.includes(i))
    .join(',');

  const bestaatEmail = db.prepare('SELECT id FROM gebruikers WHERE email = ?').get(email);
  if (bestaatEmail) {
    return res.status(409).json({ fout: 'Dit e-mailadres is al in gebruik.' });
  }
  const bestaatNaam = db.prepare('SELECT id FROM gebruikers WHERE gebruikersnaam = ?').get(gebruikersnaam.trim());
  if (bestaatNaam) {
    return res.status(409).json({ fout: 'Deze gebruikersnaam is al bezet.' });
  }

  const hash = await bcrypt.hash(wachtwoord, 10);
  db.prepare(`
    INSERT INTO gebruikers (email, wachtwoord, naam, gebruikersnaam, studiejaar, tribe, interesses, helpen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    email,
    hash,
    naam.trim(),
    gebruikersnaam.trim(),
    Number(studiejaar),
    tribe,
    schoneInteresses,
    (helpen || '').trim().slice(0, 200)
  );

  res.status(201).json({ bericht: 'Account aangemaakt!' });
});


app.post('/api/inloggen', async (req, res) => {
  const { email, wachtwoord } = req.body;

  if (!email || !wachtwoord) {
    return res.status(400).json({ fout: 'Vul je e-mailadres en wachtwoord in.' });
  }

  const gebruiker = db.prepare('SELECT * FROM gebruikers WHERE email = ?').get(email);
  const klopt = gebruiker && await bcrypt.compare(wachtwoord, gebruiker.wachtwoord);

  if (!klopt) {
    return res.status(401).json({ fout: 'E-mailadres of wachtwoord klopt niet.' });
  }

  req.session.gebruikerId = gebruiker.id;
  res.json({ bericht: 'Ingelogd!' });
});


app.get('/api/ik', (req, res) => {
  if (!req.session.gebruikerId) {
    return res.status(401).json({ fout: 'Je bent niet ingelogd.' });
  }
  const gebruiker = db.prepare('SELECT id, email FROM gebruikers WHERE id = ?').get(req.session.gebruikerId);
  res.json(gebruiker);
});

app.post('/api/uitloggen', (req, res) => {
  req.session.destroy(() => {
    res.json({ bericht: 'Uitgelogd.' });
  });
});

app.listen(POORT, () => {
  console.log(`Server draait op http://localhost:${POORT}`);
});