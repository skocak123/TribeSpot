require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./database');
const session = require('express-session')
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const POORT = 3000;
db.exec(`
  CREATE TABLE IF NOT EXISTS wachtwoord_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gebruiker_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    verloopt_op INTEGER NOT NULL
  )
`);

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

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

app.post('/api/wachtwoord-vergeten', async (req, res) => {
  const { email } = req.body;   

  if (!email) {
    return res.status(400).json({ fout: 'Vul je e-mailadres in.' });
  }

  const gebruiker = db.prepare('SELECT id FROM gebruikers WHERE email = ?').get(email);

  if (gebruiker) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const verlooptOp = Date.now() + 60 * 60 * 1000; // 1 uur geldig

    db.prepare('DELETE FROM wachtwoord_resets WHERE gebruiker_id = ?').run(gebruiker.id);
    db.prepare(
      'INSERT INTO wachtwoord_resets (gebruiker_id, token_hash, verloopt_op) VALUES (?, ?, ?)'
    ).run(gebruiker.id, tokenHash, verlooptOp);

    
        const link = `http://localhost:${POORT}/nieuw-wachtwoord.html?token=${token}`;

      try {
      await transporter.sendMail({
        from: '"TribeSpot" <noreply@tribespot.nl>',
        to: email,
        subject: 'Nieuw wachtwoord kiezen',
        text: `Aanvraag voor het nieuwe wachtwoord\n\nKlik op de knop om een nieuw wachtwoord te kiezen :\n${link}\n\n`,
        html: `
          <div style="background:#e6302b; padding:40px 16px; font-family:Arial, sans-serif;">
            <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:16px; padding:32px;">
              <h2 style="margin:0 0 24px; font-size:28px;">
                <span style="color:#00a1e1;">Tribe</span><span style="color:#e6302b;">Spot</span>
              </h2>
              <h1 style="margin:0 0 16px; font-size:24px; color:#333333;">Nieuw wachtwoord kiezen</h1>
              <p style="margin:0 0 24px; font-size:16px; line-height:1.5; color:#333333;">
                Je hebt gevraagd om je wachtwoord te resetten. Klik op de knop hieronder om een nieuw wachtwoord te kiezen. 
              </p>
              <a href="${link}" style="display:inline-block; background:#00a1e1; color:#ffffff; text-decoration:none; font-size:18px; font-weight:bold; padding:14px 28px; border-radius:8px;">
                Nieuw wachtwoord kiezen
              </a>
            </div>
          </div>
        `
      });
      
    } catch (err) {
      console.error('Mail versturen mislukt:', err.message);
    }
  }

  
  res.json({ bericht: 'Als dit adres bestaat, hebben we een e-mail gestuurd.' });
});

app.post('/api/nieuw-wachtwoord', async (req, res) => {
  const { token, wachtwoord } = req.body;

  if (!token || !wachtwoord) {
    return res.status(400).json({ fout: 'Er ontbreekt iets.' });
  }
  if (wachtwoord.length < 8) {
    return res.status(400).json({ fout: 'Je wachtwoord moet minstens 8 tekens hebben.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const reset = db.prepare('SELECT * FROM wachtwoord_resets WHERE token_hash = ?').get(tokenHash);

  if (!reset || reset.verloopt_op < Date.now()) {
    return res.status(400).json({ fout: 'Deze link is ongeldig of verlopen.' });
  }

  const hash = await bcrypt.hash(wachtwoord, 10);
  db.prepare('UPDATE gebruikers SET wachtwoord = ? WHERE id = ?').run(hash, reset.gebruiker_id);
  db.prepare('DELETE FROM wachtwoord_resets WHERE gebruiker_id = ?').run(reset.gebruiker_id);

  res.json({ bericht: 'Je wachtwoord is aangepast.' });
});

app.listen(POORT, () => {
  console.log(`Server draait op http://localhost:${POORT}`);
});