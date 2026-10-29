CREATE DATABASE IF NOT EXISTS tribespot CHARACTER SET utf8mb4;
USE tribespot;

DROP TABLE IF EXISTS wachtwoord_resets;
DROP TABLE IF EXISTS statussen;
DROP TABLE IF EXISTS gebruikers;
DROP TABLE IF EXISTS lokalen;

CREATE TABLE gebruikers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    wachtwoord VARCHAR(255) NOT NULL,
    naam VARCHAR(100) NOT NULL,
    gebruikersnaam VARCHAR(50) UNIQUE NOT NULL,
    studiejaar INT NOT NULL,
    tribe VARCHAR(1) NOT NULL,
    interesses VARCHAR(255) NOT NULL DEFAULT '',
    helpen VARCHAR(200) NOT NULL DEFAULT ''
);

CREATE TABLE lokalen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    naam VARCHAR(50) NOT NULL,
    verdieping INT NOT NULL
);

CREATE TABLE statussen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gebruiker_id INT NOT NULL,
    lokaal_id INT NOT NULL,
    werkt_aan VARCHAR(255),
    beschikbaarheid varchar(20),
    tot TIME,
    plek INT NOT NULL,
    gedeeld_op DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gebruiker_id) REFERENCES gebruikers(id) ON DELETE CASCADE,
    FOREIGN KEY (lokaal_id) REFERENCES lokalen(id),
    UNIQUE (gebruiker_id),
    UNIQUE (lokaal_id, plek)
);

CREATE TABLE wachtwoord_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gebruiker_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    verloopt_op BIGINT NOT NULL,
    FOREIGN KEY (gebruiker_id) REFERENCES gebruikers(id) ON DELETE CASCADE
);
