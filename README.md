# TribeSpot

## Starten
1. `npm install`
2. Kopieer `.env.example` naar `.env` en vul `SESSION_SECRET` in.
3. Kies de database in `.env`:
   - `DB_TYPE=sqlite`: er wordt vanzelf een bestand `tribespot.db` gemaakt.
   - `DB_TYPE=mysql`: importeer eerst `database/plattegrondimport.sql` en vul `DB_WACHTWOORD` in.
4. `npm start` en ga naar http://localhost:3000
