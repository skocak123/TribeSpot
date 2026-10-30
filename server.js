require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const { query } = require('./database');
const session = require('express-session')
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const POORT = process.env.PORT || 3000;

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

app.use(express.json({ limit: '1mb' }));

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

function alleenIngelogdApi(req, res, next) {
  if (!req.session.gebruikerId) {
    return res.status(401).json({ fout: 'Je bent niet ingelogd.' });
  }
  next();
}

function databaseFout(res, err) {
  console.log(err);
  res.status(500).json({ fout: 'Er ging iets mis met de database.' });
}

const geldigeFoto = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

// Oudere databases hebben nog geen kolom "foto": die voegen we dan toe
async function zorgVoorFotoKolom() {
  try {
    await query('ALTER TABLE gebruikers ADD COLUMN foto MEDIUMTEXT');
  } catch (err) {
    if (!/duplicate column/i.test(err.message)) throw err;
  }
}

app.get('/', alleenIngelogd, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const beveiligd = ['index.html', 'chat.html', 'profiel.html', 'kamer.html'];
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

  try {
    const bestaatEmail = await query('SELECT id FROM gebruikers WHERE email = ?', [email]);
    if (bestaatEmail.length > 0) {
      return res.status(409).json({ fout: 'Dit e-mailadres is al in gebruik.' });
    }
    const bestaatNaam = await query('SELECT id FROM gebruikers WHERE gebruikersnaam = ?', [gebruikersnaam.trim()]);
    if (bestaatNaam.length > 0) {
      return res.status(409).json({ fout: 'Deze gebruikersnaam is al bezet.' });
    }

    const hash = await bcrypt.hash(wachtwoord, 10);
    await query(`
      INSERT INTO gebruikers (email, wachtwoord, naam, gebruikersnaam, studiejaar, tribe, interesses, helpen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      email,
      hash,
      naam.trim(),
      gebruikersnaam.trim(),
      Number(studiejaar),
      tribe,
      schoneInteresses,
      (helpen || '').trim().slice(0, 200)
    ]);

    res.status(201).json({ bericht: 'Account aangemaakt!' });
  } catch (err) {
    databaseFout(res, err);
  }
});

app.post('/api/inloggen', async (req, res) => {
  const { email, wachtwoord } = req.body;

  if (!email || !wachtwoord) {
    return res.status(400).json({ fout: 'Vul je e-mailadres en wachtwoord in.' });
  }

  try {
    const [gebruiker] = await query('SELECT * FROM gebruikers WHERE email = ?', [email]);
    const klopt = gebruiker && await bcrypt.compare(wachtwoord, gebruiker.wachtwoord);

    if (!klopt) {
      return res.status(401).json({ fout: 'E-mailadres of wachtwoord klopt niet.' });
    }

    req.session.gebruikerId = gebruiker.id;
    res.json({ bericht: 'Ingelogd!' });
  } catch (err) {
    databaseFout(res, err);
  }
});

app.get('/api/ik', alleenIngelogdApi, async (req, res) => {
  try {
    const [gebruiker] = await query('SELECT id, email, naam, foto FROM gebruikers WHERE id = ?', [req.session.gebruikerId]);
    res.json(gebruiker);
  } catch (err) {
    databaseFout(res, err);
  }
});

app.get('/api/profiel', alleenIngelogdApi, async (req, res) => {
  try {
    const [gebruiker] = await query(
      'SELECT naam, tribe, studiejaar, interesses, helpen, foto FROM gebruikers WHERE id = ?',
      [req.session.gebruikerId]
    );
    res.json(gebruiker);
  } catch (err) {
    databaseFout(res, err);
  }
});

app.put('/api/profiel', alleenIngelogdApi, async (req, res) => {
  const { naam, studiejaar, tribe, interesses, helpen, foto } = req.body;

  // foto: weglaten = niet veranderen, null = verwijderen, anders een kleine afbeelding als data-URL
  if (foto !== undefined && foto !== null &&
      (typeof foto !== 'string' || foto.length > 500000 || !geldigeFoto.test(foto))) {
    return res.status(400).json({ fout: 'Deze foto kan niet worden opgeslagen.' });
  }

  if (!naam || !naam.trim()) {
    return res.status(400).json({ fout: 'Vul je naam in.' });
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

  try {
    await query(
      'UPDATE gebruikers SET naam = ?, studiejaar = ?, tribe = ?, interesses = ?, helpen = ? WHERE id = ?',
      [naam.trim(), Number(studiejaar), tribe, schoneInteresses, (helpen || '').trim().slice(0, 200), req.session.gebruikerId]
    );
    if (foto !== undefined) {
      await query('UPDATE gebruikers SET foto = ? WHERE id = ?', [foto, req.session.gebruikerId]);
    }
    res.json({ bericht: 'Profiel opgeslagen!' });
  } catch (err) {
    databaseFout(res, err);
  }
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

  try {
    const [gebruiker] = await query('SELECT id FROM gebruikers WHERE email = ?', [email]);

    if (gebruiker) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const verlooptOp = Date.now() + 60 * 60 * 1000;

      await query('DELETE FROM wachtwoord_resets WHERE gebruiker_id = ?', [gebruiker.id]);
      await query(
        'INSERT INTO wachtwoord_resets (gebruiker_id, token_hash, verloopt_op) VALUES (?, ?, ?)',
        [gebruiker.id, tokenHash, verlooptOp]
      );

      const link = `http://localhost:${POORT}/nieuw-wachtwoord.html?token=${token}`;

      if (!process.env.MAIL_HOST) {
        console.log('Geen MAIL_HOST in .env, resetlink voor ' + email + ': ' + link);
      } else {
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
    }

    res.json({ bericht: 'Als dit adres bestaat, hebben we een e-mail gestuurd.' });
  } catch (err) {
    databaseFout(res, err);
  }
});

app.post('/api/nieuw-wachtwoord', async (req, res) => {
  const { token, wachtwoord } = req.body;

  if (!token || !wachtwoord) {
    return res.status(400).json({ fout: 'Er ontbreekt iets.' });
  }
  if (wachtwoord.length < 8) {
    return res.status(400).json({ fout: 'Je wachtwoord moet minstens 8 tekens hebben.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [reset] = await query('SELECT * FROM wachtwoord_resets WHERE token_hash = ?', [tokenHash]);

    if (!reset || reset.verloopt_op < Date.now()) {
      return res.status(400).json({ fout: 'Deze link is ongeldig of verlopen.' });
    }

    const hash = await bcrypt.hash(wachtwoord, 10);
    await query('UPDATE gebruikers SET wachtwoord = ? WHERE id = ?', [hash, reset.gebruiker_id]);
    await query('DELETE FROM wachtwoord_resets WHERE gebruiker_id = ?', [reset.gebruiker_id]);

    res.json({ bericht: 'Je wachtwoord is aangepast.' });
  } catch (err) {
    databaseFout(res, err);
  }
});

function tijdVanNu() {
  const nu = new Date();
  return String(nu.getHours()).padStart(2, '0') + ':' + String(nu.getMinutes()).padStart(2, '0');
}

function vandaagBegin() {
  const nu = new Date();
  return nu.getFullYear() + '-' + String(nu.getMonth() + 1).padStart(2, '0') + '-' +
    String(nu.getDate()).padStart(2, '0') + ' 00:00:00';
}

// Statussen waarvan de "tot"-tijd voorbij is (of die van een eerdere dag zijn) weghalen
async function verwijderVerlopenStatussen() {
  await query('DELETE FROM statussen WHERE tot <= ? OR gedeeld_op < ?', [tijdVanNu(), vandaagBegin()]);
}

const geldigeTijd = /^([01]\d|2[0-3]):[0-5]\d$/;

app.get('/api/statussen', async (req, res) => {
  try {
    await verwijderVerlopenStatussen();
    const rijen = await query(`SELECT gebruikers.naam, lokalen.naam AS lokaal, lokalen.verdieping, statussen.plek,
      statussen.werkt_aan, statussen.beschikbaarheid, statussen.tot
      FROM statussen
      JOIN gebruikers ON statussen.gebruiker_id = gebruikers.id
      JOIN lokalen ON statussen.lokaal_id = lokalen.id`);

    rijen.forEach((rij) => {
      rij.tot = String(rij.tot).slice(0, 5);
    });
    res.json(rijen);
  } catch (err) {
    databaseFout(res, err);
  }
});

app.get('/api/online', async (req, res) => {
  try {
    await verwijderVerlopenStatussen();
    const online = await query('SELECT naam FROM gebruikers WHERE id IN (SELECT gebruiker_id FROM statussen) ORDER BY naam');
    const offline = await query('SELECT naam FROM gebruikers WHERE id NOT IN (SELECT gebruiker_id FROM statussen) ORDER BY naam');
    res.json({ online: online, offline: offline });
  } catch (err) {
    databaseFout(res, err);
  }
});

app.post('/api/statussen', alleenIngelogdApi, async (req, res) => {
  const { lokaal, plek, werkt_aan, beschikbaarheid, tot } = req.body;
  const mijnGebruikerId = req.session.gebruikerId;

  if (!lokaal || !plek || !beschikbaarheid || !tot) {
    return res.status(400).json({ fout: 'Niet alles is ingevuld.' });
  }
  if (!geldigeTijd.test(tot) || tot <= tijdVanNu()) {
    return res.status(400).json({ fout: 'Kies een tijd die later is dan nu.' });
  }

  try {
    await verwijderVerlopenStatussen();
    const lokalen = await query('SELECT id FROM lokalen WHERE naam = ?', [lokaal]);
    if (lokalen.length === 0) {
      return res.status(404).json({ fout: 'Dit lokaal bestaat niet.' });
    }
    const lokaalId = lokalen[0].id;

    const bezet = await query(
      'SELECT id FROM statussen WHERE lokaal_id = ? AND plek = ? AND gebruiker_id != ?',
      [lokaalId, plek, mijnGebruikerId]
    );
    if (bezet.length > 0) {
      return res.status(409).json({ fout: 'Deze plek is al bezet.' });
    }

    await query('DELETE FROM statussen WHERE gebruiker_id = ?', [mijnGebruikerId]);
    await query(
      'INSERT INTO statussen (gebruiker_id, lokaal_id, werkt_aan, beschikbaarheid, tot, plek) VALUES (?, ?, ?, ?, ?, ?)',
      [mijnGebruikerId, lokaalId, werkt_aan, beschikbaarheid, tot, plek]
    );
    res.json({ gelukt: true });
  } catch (err) {
    databaseFout(res, err);
  }
});

app.delete('/api/statussen', alleenIngelogdApi, async (req, res) => {
  try {
    await query('DELETE FROM statussen WHERE gebruiker_id = ?', [req.session.gebruikerId]);
    res.json({ gelukt: true });
  } catch (err) {
    databaseFout(res, err);
  }
});

app.get('/api/mijn-status', alleenIngelogdApi, async (req, res) => {
  try {
    await verwijderVerlopenStatussen();
    const [status] = await query('SELECT tot FROM statussen WHERE gebruiker_id = ?', [req.session.gebruikerId]);
    res.json(status ? { tot: String(status.tot).slice(0, 5) } : null);
  } catch (err) {
    databaseFout(res, err);
  }
});

app.patch('/api/statussen', alleenIngelogdApi, async (req, res) => {
  const { tot } = req.body;

  if (!geldigeTijd.test(tot || '') || tot <= tijdVanNu()) {
    return res.status(400).json({ fout: 'Kies een tijd die later is dan nu.' });
  }

  try {
    const resultaat = await query('UPDATE statussen SET tot = ? WHERE gebruiker_id = ?', [tot, req.session.gebruikerId]);
    if (resultaat.changes === 0) {
      return res.status(404).json({ fout: 'Je hebt op dit moment geen plek.' });
    }
    res.json({ gelukt: true });
  } catch (err) {
    databaseFout(res, err);
  }
});

zorgVoorFotoKolom().then(() => {
  app.listen(POORT, () => {
    console.log(`Server draait op http://localhost:${POORT}`);
  });
});
