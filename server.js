require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const { query } = require('./database');
const verdiepingen = require('./public/js/lokalen');
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
app.use((req, res, next) => {
  if (req.body === undefined || req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    req.body = {};
  }
  next();
});

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

const MAX_EMAIL = 100;
const MAX_WACHTWOORD = 72;
const MAX_NAAM = 50;
const MAX_WERKT_AAN = 100;
const MAX_BERICHT = 1000;
const geldigeGebruikersnaam = /^[A-Za-z0-9._]{3,30}$/;
const BESCHIKBAARHEDEN = ['aanschuiven', 'vragen', 'focus'];

function isTekst(waarde) {
  return typeof waarde === 'string';
}

function isGevuldeTekst(waarde) {
  return isTekst(waarde) && waarde.trim().length > 0;
}

function isPositiefGetal(waarde) {
  const getal = Number(waarde);
  return Number.isInteger(getal) && getal > 0 && getal <= 1000;
}

async function zorgVoorFotoKolom() {
  try {
    await query('ALTER TABLE gebruikers ADD COLUMN foto MEDIUMTEXT');
  } catch (err) {
    if (!/duplicate column/i.test(err.message)) throw err;
  }
}

async function zorgVoorGelezenKolom() {
  try {
    await query('ALTER TABLE berichten ADD COLUMN gelezen INTEGER NOT NULL DEFAULT 0');
    await query('UPDATE berichten SET gelezen = 1');
  } catch (err) {
    if (!/duplicate column/i.test(err.message)) throw err;
  }
}
async function zorgVoorVerbindingen() {
  await query(`CREATE TABLE IF NOT EXISTS verbindingen (
    gebruiker_a INT NOT NULL,
    gebruiker_b INT NOT NULL,
    sinds DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (gebruiker_a, gebruiker_b),
    FOREIGN KEY (gebruiker_a) REFERENCES gebruikers(id) ON DELETE CASCADE,
    FOREIGN KEY (gebruiker_b) REFERENCES gebruikers(id) ON DELETE CASCADE
  )`);
  try {
    await query('ALTER TABLE statussen ADD COLUMN tafel INT');
  } catch (err) {
    if (!/duplicate column/i.test(err.message)) throw err;
  }
}

app.get('/', alleenIngelogd, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const beveiligd = ['index.html', 'chat.html', 'profiel.html', 'kamer.html',
  'games-kamer.html', 'muziek-kamer.html', 'sport-kamer.html', 'regelspagina.html'];
beveiligd.forEach((pagina) => {
  app.get('/' + pagina, alleenIngelogd, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', pagina));
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/registreren', async (req, res) => {
  const { email, wachtwoord, naam, gebruikersnaam, studiejaar, tribe, interesses, helpen } = req.body;

  if (!isGevuldeTekst(email) || !isTekst(wachtwoord) || !wachtwoord ||
      !isGevuldeTekst(naam) || !isGevuldeTekst(gebruikersnaam)) {
    return res.status(400).json({ fout: 'Vul alle verplichte velden in.' });
  }
  if (email.length > MAX_EMAIL) {
    return res.status(400).json({ fout: 'Je e-mailadres is te lang.' });
  }
  if (!email.endsWith('@student.hu.nl')) {
    return res.status(400).json({ fout: 'Gebruik je HU-e-mailadres (@student.hu.nl).' });
  }
  if (wachtwoord.length < 8) {
    return res.status(400).json({ fout: 'Je wachtwoord moet minstens 8 tekens hebben.' });
  }
  if (wachtwoord.length > MAX_WACHTWOORD) {
    return res.status(400).json({ fout: 'Je wachtwoord mag maximaal ' + MAX_WACHTWOORD + ' tekens hebben.' });
  }
  if (naam.trim().length > MAX_NAAM) {
    return res.status(400).json({ fout: 'Je naam mag maximaal ' + MAX_NAAM + ' tekens hebben.' });
  }
  if (!geldigeGebruikersnaam.test(gebruikersnaam.trim())) {
    return res.status(400).json({ fout: 'Je gebruikersnaam moet 3 tot 30 tekens zijn en mag alleen letters, cijfers, een punt en _ bevatten.' });
  }
  if (helpen !== undefined && helpen !== null && !isTekst(helpen)) {
    return res.status(400).json({ fout: 'Ongeldige invoer bij "kan helpen met".' });
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
    const resultaat = await query(`
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

    req.session.gebruikerId = resultaat.insertId;
    res.status(201).json({ bericht: 'Account aangemaakt!' });
  } catch (err) {
    databaseFout(res, err);
  }
});

app.post('/api/inloggen', async (req, res) => {
  const { email, wachtwoord } = req.body;

  if (!isGevuldeTekst(email) || !isTekst(wachtwoord) || !wachtwoord) {
    return res.status(400).json({ fout: 'Vul je e-mailadres en wachtwoord in.' });
  }
  if (email.length > MAX_EMAIL || wachtwoord.length > MAX_WACHTWOORD) {
    return res.status(401).json({ fout: 'E-mailadres of wachtwoord klopt niet.' });
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
    const [gebruiker] = await query('SELECT id, email, naam, gebruikersnaam, foto FROM gebruikers WHERE id = ?', [req.session.gebruikerId]);
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

app.get('/api/verbindingen', alleenIngelogdApi, async (req, res) => {
  const ik = req.session.gebruikerId;
  try {
    const rijen = await query(
      `SELECT gebruikers.naam, gebruikers.tribe
       FROM verbindingen
       JOIN gebruikers ON gebruikers.id = CASE WHEN verbindingen.gebruiker_a = ? THEN verbindingen.gebruiker_b ELSE verbindingen.gebruiker_a END
       WHERE verbindingen.gebruiker_a = ? OR verbindingen.gebruiker_b = ?
       ORDER BY gebruikers.naam`,
      [ik, ik, ik]
    );
    res.json(rijen);
  } catch (err) {
    databaseFout(res, err);
  }
});

app.put('/api/profiel', alleenIngelogdApi, async (req, res) => {
  const { naam, studiejaar, tribe, interesses, helpen, foto } = req.body;

  if (foto !== undefined && foto !== null &&
      (typeof foto !== 'string' || foto.length > 500000 || !geldigeFoto.test(foto))) {
    return res.status(400).json({ fout: 'Deze foto kan niet worden opgeslagen.' });
  }

  if (!isGevuldeTekst(naam)) {
    return res.status(400).json({ fout: 'Vul je naam in.' });
  }
  if (naam.trim().length > MAX_NAAM) {
    return res.status(400).json({ fout: 'Je naam mag maximaal ' + MAX_NAAM + ' tekens hebben.' });
  }
  if (helpen !== undefined && helpen !== null && !isTekst(helpen)) {
    return res.status(400).json({ fout: 'Ongeldige invoer bij "kan helpen met".' });
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
app.delete('/api/account', alleenIngelogdApi, async (req, res) => {
  const { bevestiging } = req.body;

  if (bevestiging !== 'VERWIJDEREN') {
    return res.status(400).json({ fout: 'Typ VERWIJDEREN in hoofdletters om je account te verwijderen.' });
  }

  try {
    const id = req.session.gebruikerId;
    await query('DELETE FROM berichten WHERE van_id = ? OR naar_id = ?', [id, id]);
    await query('DELETE FROM gebruikers WHERE id = ?', [id]);
    req.session.destroy(() => {
      res.json({ bericht: 'Account verwijderd.' });
    });
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

  if (!isGevuldeTekst(email) || email.length > MAX_EMAIL) {
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

      const basisUrl = process.env.APP_URL || `http://localhost:${POORT}`;
      const link = `${basisUrl}/nieuw-wachtwoord.html?token=${token}`;

      if (!process.env.MAIL_HOST) {
        console.log('Geen MAIL_HOST in .env, resetlink voor ' + email + ': ' + link);
      } else {
        try {
          await transporter.sendMail({
            from: process.env.MAIL_FROM || process.env.MAIL_USER,
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

  if (!isGevuldeTekst(token) || !isTekst(wachtwoord) || !wachtwoord) {
    return res.status(400).json({ fout: 'Er ontbreekt iets.' });
  }
  if (wachtwoord.length < 8) {
    return res.status(400).json({ fout: 'Je wachtwoord moet minstens 8 tekens hebben.' });
  }
  if (wachtwoord.length > MAX_WACHTWOORD) {
    return res.status(400).json({ fout: 'Je wachtwoord mag maximaal ' + MAX_WACHTWOORD + ' tekens hebben.' });
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
    const online = await query('SELECT naam, gebruikersnaam FROM gebruikers WHERE id IN (SELECT gebruiker_id FROM statussen) ORDER BY naam');
    const offline = await query('SELECT naam, gebruikersnaam FROM gebruikers WHERE id NOT IN (SELECT gebruiker_id FROM statussen) ORDER BY naam');
    res.json({ online: online, offline: offline });
  } catch (err) {
    databaseFout(res, err);
  }
});

app.post('/api/statussen', alleenIngelogdApi, async (req, res) => {
  const { lokaal, plek, werkt_aan, beschikbaarheid, tot, tafel } = req.body;
  const mijnGebruikerId = req.session.gebruikerId;

  if (!isGevuldeTekst(lokaal) || !plek || !beschikbaarheid || !isTekst(tot)) {
    return res.status(400).json({ fout: 'Niet alles is ingevuld.' });
  }
  if (!isPositiefGetal(plek)) {
    return res.status(400).json({ fout: 'Kies een geldige stoel.' });
  }
  if (tafel !== undefined && tafel !== null && tafel !== 0 && !isPositiefGetal(tafel)) {
    return res.status(400).json({ fout: 'Kies een geldige tafel.' });
  }
  if (!BESCHIKBAARHEDEN.includes(beschikbaarheid)) {
    return res.status(400).json({ fout: 'Kies Aanschuiven, Vragen of Focus.' });
  }
  if (werkt_aan !== undefined && werkt_aan !== null && !isTekst(werkt_aan)) {
    return res.status(400).json({ fout: 'Ongeldige invoer bij "ik werk aan".' });
  }
  if (isTekst(werkt_aan) && werkt_aan.trim().length > MAX_WERKT_AAN) {
    return res.status(400).json({ fout: '"Ik werk aan" mag maximaal ' + MAX_WERKT_AAN + ' tekens hebben.' });
  }
  if (!geldigeTijd.test(tot) || tot <= tijdVanNu()) {
    return res.status(400).json({ fout: 'Kies een tijd die later is dan nu.' });
  }

  const stilteplek = verdiepingen.some((verdieping) =>
    verdieping.lokalen.some((plaats) => plaats.naam === lokaal && plaats.soort === 'stilte')
  );
  if (stilteplek && beschikbaarheid !== 'focus') {
    return res.status(400).json({ fout: 'Op een stilteplek kun je alleen Focus kiezen.' });
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
      [lokaalId, Number(plek), mijnGebruikerId]
    );
    if (bezet.length > 0) {
      return res.status(409).json({ fout: 'Deze plek is al bezet.' });
    }

    await query('DELETE FROM statussen WHERE gebruiker_id = ?', [mijnGebruikerId]);
    await query(
              'INSERT INTO statussen (gebruiker_id, lokaal_id, werkt_aan, beschikbaarheid, tot, plek, tafel) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [mijnGebruikerId, lokaalId, isTekst(werkt_aan) ? werkt_aan.trim() : '', beschikbaarheid, tot, Number(plek), tafel ? Number(tafel) : null]
      );
      
    if (tafel) {
      const tafelgenoten = await query(
        'SELECT gebruiker_id FROM statussen WHERE lokaal_id = ? AND tafel = ? AND gebruiker_id != ?',
        [lokaalId, tafel, mijnGebruikerId]
      );
      for (const genoot of tafelgenoten) {
        const a = Math.min(mijnGebruikerId, genoot.gebruiker_id);
        const b = Math.max(mijnGebruikerId, genoot.gebruiker_id);
        const bestaat = await query('SELECT gebruiker_a FROM verbindingen WHERE gebruiker_a = ? AND gebruiker_b = ?', [a, b]);
        if (bestaat.length === 0) {
          await query('INSERT INTO verbindingen (gebruiker_a, gebruiker_b) VALUES (?, ?)', [a, b]);
        }
      }
    }

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

function tijdVan(verstuurdOp) {
  const datum = verstuurdOp instanceof Date ? verstuurdOp : new Date(verstuurdOp.replace(' ', 'T') + 'Z');
  return datum.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

function kortTijdstip(verstuurdOp) {
  const datum = verstuurdOp instanceof Date ? verstuurdOp : new Date(verstuurdOp.replace(' ', 'T') + 'Z');
  if (datum.toDateString() === new Date().toDateString()) {
    return datum.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  }
  return datum.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

app.get('/api/inbox', alleenIngelogdApi, async (req, res) => {
  const ik = req.session.gebruikerId;

  try {
    const rijen = await query(
      'SELECT van_id, naar_id, tekst, verstuurd_op, gelezen FROM berichten WHERE van_id = ? OR naar_id = ? ORDER BY id DESC',
      [ik, ik]
    );

    const gesprekken = new Map();
    for (const rij of rijen) {
      const anderId = rij.van_id === ik ? rij.naar_id : rij.van_id;
      if (!gesprekken.has(anderId)) {
        gesprekken.set(anderId, {
          laatste: rij.tekst,
          van_mij: rij.van_id === ik,
          tijd: kortTijdstip(rij.verstuurd_op),
          ongelezen: 0
        });
      }
      if (rij.naar_id === ik && !rij.gelezen) {
        gesprekken.get(anderId).ongelezen++;
      }
    }

    if (gesprekken.size === 0) {
      return res.json([]);
    }

    const ids = [...gesprekken.keys()];
    const mensen = await query(
      `SELECT id, naam, gebruikersnaam FROM gebruikers WHERE id IN (${ids.map(() => '?').join(', ')})`,
      ids
    );
    const perId = new Map(mensen.map((m) => [m.id, m]));

    const inbox = [];
    for (const [anderId, gesprek] of gesprekken) {
      const ander = perId.get(anderId);
      if (!ander) continue;
      inbox.push({ naam: ander.naam, gebruikersnaam: ander.gebruikersnaam, ...gesprek });
    }
    res.json(inbox);
  } catch (err) {
    databaseFout(res, err);
  }
});

app.get('/api/ongelezen', alleenIngelogdApi, async (req, res) => {
  const ik = req.session.gebruikerId;

  try {
    const [telling] = await query('SELECT COUNT(*) AS totaal FROM berichten WHERE naar_id = ? AND gelezen = 0', [ik]);
    const [nieuwste] = await query(
      `SELECT berichten.id, berichten.tekst, gebruikers.naam, gebruikers.gebruikersnaam
      FROM berichten
      JOIN gebruikers ON gebruikers.id = berichten.van_id
      WHERE berichten.naar_id = ? AND berichten.gelezen = 0
      ORDER BY berichten.id DESC
      LIMIT 1`,
      [ik]
    );
    res.json({ totaal: Number(telling.totaal), nieuwste: nieuwste || null });
  } catch (err) {
    databaseFout(res, err);
  }
});

app.get('/api/berichten/:gebruikersnaam', alleenIngelogdApi, async (req, res) => {
  const mijnGebruikerId = req.session.gebruikerId;

  try {
    const gebruikers = await query('SELECT id FROM gebruikers WHERE gebruikersnaam = ?', [req.params.gebruikersnaam]);
    if (gebruikers.length === 0) {
      return res.status(404).json({ fout: 'Deze gebruiker bestaat niet.' });
    }
    const anderId = gebruikers[0].id;

    await query(
      'UPDATE berichten SET gelezen = 1 WHERE van_id = ? AND naar_id = ? AND gelezen = 0',
      [anderId, mijnGebruikerId]
    );

    const rijen = await query(
      `SELECT tekst, van_id = ? AS van_mij, verstuurd_op
      FROM berichten
      WHERE (van_id = ? AND naar_id = ?) OR (van_id = ? AND naar_id = ?)
      ORDER BY verstuurd_op, id`,
      [mijnGebruikerId, mijnGebruikerId, anderId, anderId, mijnGebruikerId]
    );

    res.json(rijen.map((rij) => ({
      tekst: rij.tekst,
      van_mij: rij.van_mij,
      tijd: tijdVan(rij.verstuurd_op)
    })));
  } catch (err) {
    databaseFout(res, err);
  }
});

app.get('/api/mijn-status', alleenIngelogdApi, async (req, res) => {
  try {
    await verwijderVerlopenStatussen();
    const [status] = await query(
      `SELECT statussen.tot, statussen.plek, lokalen.naam AS lokaal
      FROM statussen
      JOIN lokalen ON statussen.lokaal_id = lokalen.id
      WHERE statussen.gebruiker_id = ?`,
      [req.session.gebruikerId]
    );
    res.json(status ? { tot: String(status.tot).slice(0, 5), lokaal: status.lokaal, plek: status.plek } : null);
  } catch (err) {
    databaseFout(res, err);
  }
});

app.post('/api/berichten', alleenIngelogdApi, async (req, res) => {
  const { naar, tekst } = req.body;

  if (!isGevuldeTekst(naar) || !isGevuldeTekst(tekst)) {
    return res.status(400).json({ fout: 'Niet alles is ingevuld.' });
  }
  if (tekst.trim().length > MAX_BERICHT) {
    return res.status(400).json({ fout: 'Een bericht mag maximaal ' + MAX_BERICHT + ' tekens hebben.' });
  }

  try {
    const gebruikers = await query('SELECT id FROM gebruikers WHERE gebruikersnaam = ?', [naar]);
    if (gebruikers.length === 0) {
      return res.status(404).json({ fout: 'Deze gebruiker bestaat niet.' });
    }

    await query(
      'INSERT INTO berichten (van_id, naar_id, tekst) VALUES (?, ?, ?)',
      [req.session.gebruikerId, gebruikers[0].id, tekst.trim()]
    );
    res.json({ gelukt: true });
  } catch (err) {
    databaseFout(res, err);
  }
});

app.patch('/api/statussen', alleenIngelogdApi, async (req, res) => {
  const { tot } = req.body;

  if (!isTekst(tot) || !geldigeTijd.test(tot) || tot <= tijdVanNu()) {
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

const KAMERS = ['games', 'muziek', 'sport'];

async function zorgVoorKamerBerichten() {
  if (process.env.DB_TYPE === 'mysql') {
    await query(`CREATE TABLE IF NOT EXISTS kamer_berichten (
      id INT AUTO_INCREMENT PRIMARY KEY,
      kamer VARCHAR(20) NOT NULL,
      gebruiker_id INT NOT NULL,
      bericht VARCHAR(500) NOT NULL,
      tijd DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gebruiker_id) REFERENCES gebruikers(id) ON DELETE CASCADE
    )`);
  } else {
    await query(`CREATE TABLE IF NOT EXISTS kamer_berichten (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kamer TEXT NOT NULL,
      gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
      bericht TEXT NOT NULL,
      tijd TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
  }
  await query('DELETE FROM kamer_berichten');
}

app.get('/api/kamers/:kamer/berichten', alleenIngelogdApi, async (req, res) => {
  const kamer = req.params.kamer;
  if (!KAMERS.includes(kamer)) {
    return res.status(404).json({ fout: 'Deze kamer bestaat niet.' });
  }
  const na = Number(req.query.na) || 0;

  try {
    const rijen = await query(`
      SELECT kamer_berichten.id, kamer_berichten.bericht, kamer_berichten.tijd,
             kamer_berichten.gebruiker_id, gebruikers.gebruikersnaam
      FROM kamer_berichten
      JOIN gebruikers ON kamer_berichten.gebruiker_id = gebruikers.id
      WHERE kamer_berichten.kamer = ? AND kamer_berichten.id > ?
      ORDER BY kamer_berichten.id DESC
      LIMIT 50
    `, [kamer, na]);

    rijen.reverse();
    res.json(rijen.map((rij) => ({
      id: rij.id,
      bericht: rij.bericht,
      gebruikersnaam: rij.gebruikersnaam,
      tijd: tijdVan(rij.tijd),
      ik: rij.gebruiker_id === req.session.gebruikerId
    })));
  } catch (err) {
    databaseFout(res, err);
  }
});

app.post('/api/kamers/:kamer/berichten', alleenIngelogdApi, async (req, res) => {
  const kamer = req.params.kamer;
  const bericht = isTekst(req.body.bericht) ? req.body.bericht.trim() : '';

  if (!KAMERS.includes(kamer)) {
    return res.status(404).json({ fout: 'Deze kamer bestaat niet.' });
  }
  if (bericht.length === 0 || bericht.length > 500) {
    return res.status(400).json({ fout: 'Een bericht moet tussen 1 en 500 tekens zijn.' });
  }

  try {
    await query(
      'INSERT INTO kamer_berichten (kamer, gebruiker_id, bericht) VALUES (?, ?, ?)',
      [kamer, req.session.gebruikerId, bericht]
    );
    res.status(201).json({ gelukt: true });
  } catch (err) {
    databaseFout(res, err);
  }
});

zorgVoorFotoKolom().then(zorgVoorVerbindingen).then(zorgVoorKamerBerichten).then(zorgVoorGelezenKolom).then(() => {
  app.listen(POORT, () => {
    console.log(`Server draait op http://localhost:${POORT}`);
  });
});