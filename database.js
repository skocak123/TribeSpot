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

  if (db.prepare('SELECT COUNT(*) AS aantal FROM lokalen').get().aantal === 0) {
    const voegToe = db.prepare('INSERT INTO lokalen (naam, verdieping) VALUES (?, ?)');
    const beganeGrond = ['Kantine', 'Vergaderruimte', 'Lokaal 0.03', 'Lokaal 0.04', 'Lokaal 0.05', 'Lokaal 0.06'];
    beganeGrond.forEach((naam) => voegToe.run(naam, 0));
    for (let verdieping = 1; verdieping <= 4; verdieping++) {
      for (let nummer = 1; nummer <= 6; nummer++) {
        voegToe.run('Lokaal ' + verdieping + '.0' + nummer, verdieping);
      }
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

module.exports = { query };
