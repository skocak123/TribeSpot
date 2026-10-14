const express = require('express');
const path = require('path');
let mysql = require('mysql2');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.DB_WACHTWOORD,
  database: "tribespot"
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
} )