const DB_TYPE = process.env.DB_TYPE || 'sqlite';

let query;

if (DB_TYPE === 'mysql') {
  const mysql = require('mysql2');

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_GEBRUIKER || 'root',
    password: process.env.DB_WACHTWOORD,
    database: 'tribespot'
  }).promise();

  query = async (sql, waarden = []) => {
    const [resultaat] = await pool.query(sql, waarden);
    if (Array.isArray(resultaat)) return resultaat;
    return { insertId: resultaat.insertId, changes: resultaat.affectedRows };
  };
} else if (DB_TYPE === 'sqlite') {
  const Database = require('better-sqlite3');
  const db = new Database('tribespot.db');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS gebruikers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      wachtwoord TEXT NOT NULL,
      naam TEXT NOT NULL,
      gebruikersnaam TEXT UNIQUE NOT NULL,
      studiejaar INTEGER NOT NULL,
      tribe TEXT NOT NULL,
      interesses TEXT NOT NULL DEFAULT '',
      helpen TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS lokalen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      naam TEXT NOT NULL,
      verdieping INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verdiepingen (
      nummer INTEGER PRIMARY KEY,
      naam TEXT NOT NULL,
      plaatje TEXT NOT NULL,
      verhouding REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS statussen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gebruiker_id INTEGER NOT NULL UNIQUE REFERENCES gebruikers(id) ON DELETE CASCADE,
      lokaal_id INTEGER NOT NULL REFERENCES lokalen(id),
      werkt_aan TEXT,
      beschikbaarheid TEXT,
      tot TEXT,
      plek INTEGER NOT NULL,
      gedeeld_op TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (lokaal_id, plek)
    );

    CREATE TABLE IF NOT EXISTS wachtwoord_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      verloopt_op INTEGER NOT NULL
    );
  `);

  // Een bestaande database mist deze kolommen nog, CREATE TABLE IF NOT EXISTS voegt ze niet toe.
  const nieuweKolommen = {
    x: 'REAL',
    y: 'REAL',
    gebied_x: 'REAL',
    gebied_y: 'REAL',
    gebied_b: 'REAL',
    gebied_h: 'REAL',
    soort: "TEXT NOT NULL DEFAULT 'werkplek'",
    tafels: 'INTEGER NOT NULL DEFAULT 0',
    tafels_geteld: 'INTEGER NOT NULL DEFAULT 0',
    kort: 'TEXT',
    volgorde: 'INTEGER NOT NULL DEFAULT 0'
  };
  const bestaandeKolommen = db.pragma('table_info(lokalen)').map((kolom) => kolom.name);
  for (const [naam, type] of Object.entries(nieuweKolommen)) {
    if (!bestaandeKolommen.includes(naam)) {
      db.exec(`ALTER TABLE lokalen ADD COLUMN ${naam} ${type}`);
    }
  }

  query = async (sql, waarden = []) => {
    const opdracht = db.prepare(sql);
    if (opdracht.reader) return opdracht.all(waarden);
    const resultaat = opdracht.run(waarden);
    return { insertId: Number(resultaat.lastInsertRowid), changes: resultaat.changes };
  };
} else {
  throw new Error('DB_TYPE in .env moet "sqlite" of "mysql" zijn.');
}

console.log('Database: ' + DB_TYPE);

const verdiepingen = require('./public/js/lokalen');

// lokalen.js is de startlijst: bij elke start komt de database daarmee overeen.
const lokalenKlaar = (async () => {
  const namen = [];
  let volgorde = 0;

  for (const verdieping of verdiepingen) {
    const verdiepingWaarden = [verdieping.naam, verdieping.plaatje, verdieping.verhouding, verdieping.nummer];
    const verdiepingBestaat = await query('SELECT nummer FROM verdiepingen WHERE nummer = ?', [verdieping.nummer]);
    if (verdiepingBestaat.length === 0) {
      await query('INSERT INTO verdiepingen (naam, plaatje, verhouding, nummer) VALUES (?, ?, ?, ?)', verdiepingWaarden);
    } else {
      await query('UPDATE verdiepingen SET naam = ?, plaatje = ?, verhouding = ? WHERE nummer = ?', verdiepingWaarden);
    }

    for (const lokaal of verdieping.lokalen) {
      namen.push(lokaal.naam);
      volgorde++;

      const waarden = [
        verdieping.nummer, lokaal.x, lokaal.y,
        lokaal.gebied.x, lokaal.gebied.y, lokaal.gebied.b, lokaal.gebied.h,
        lokaal.soort, lokaal.tafels, lokaal.tafelsGeteld ? 1 : 0, lokaal.kort ?? null, volgorde,
        lokaal.naam
      ];
      const bestaat = await query('SELECT id FROM lokalen WHERE naam = ?', [lokaal.naam]);
      if (bestaat.length === 0) {
        await query(`INSERT INTO lokalen (verdieping, x, y, gebied_x, gebied_y, gebied_b, gebied_h,
          soort, tafels, tafels_geteld, kort, volgorde, naam) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, waarden);
      } else {
        await query(`UPDATE lokalen SET verdieping = ?, x = ?, y = ?, gebied_x = ?, gebied_y = ?, gebied_b = ?, gebied_h = ?,
          soort = ?, tafels = ?, tafels_geteld = ?, kort = ?, volgorde = ? WHERE naam = ?`, waarden);
      }
    }
  }

  // Oude lokalen opruimen. Statussen eerst, want die verwijzen naar het lokaal.
  const alleLokalen = await query('SELECT id, naam FROM lokalen');
  for (const lokaal of alleLokalen) {
    if (!namen.includes(lokaal.naam)) {
      await query('DELETE FROM statussen WHERE lokaal_id = ?', [lokaal.id]);
      await query('DELETE FROM lokalen WHERE id = ?', [lokaal.id]);
    }
  }
})().catch((err) => {
  console.error('Lokalen klaarzetten mislukt (gebruik je MySQL? Importeer dan database/plattegrondimport.sql opnieuw):', err.message);
});

module.exports = { query, lokalenKlaar };
