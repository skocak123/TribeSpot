const Database = require('better-sqlite3');

const db = new Database('tribespot.db');

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
  )
`);

module.exports = db;