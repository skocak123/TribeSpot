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

INSERT INTO lokalen (naam, verdieping) VALUES
('Kantine', 0),
('Vergaderruimte', 0),
('Lokaal 0.03', 0),
('Lokaal 0.04', 0),
('Lokaal 0.05', 0),
('Lokaal 0.06', 0);

INSERT INTO lokalen (naam, verdieping) VALUES
('Lokaal 1.01', 1),
('Lokaal 1.02', 1),
('Lokaal 1.03', 1),
('Lokaal 1.04', 1),
('Lokaal 1.05', 1),
('Lokaal 1.06', 1);

INSERT INTO lokalen (naam, verdieping) VALUES
('Lokaal 2.01', 2),
('Lokaal 2.02', 2),
('Lokaal 2.03', 2),
('Lokaal 2.04', 2),
('Lokaal 2.05', 2),
('Lokaal 2.06', 2);

INSERT INTO lokalen (naam, verdieping) VALUES
('Lokaal 3.01', 3),
('Lokaal 3.02', 3),
('Lokaal 3.03', 3),
('Lokaal 3.04', 3),
('Lokaal 3.05', 3),
('Lokaal 3.06', 3);

INSERT INTO lokalen (naam, verdieping) VALUES
('Lokaal 4.01', 4),
('Lokaal 4.02', 4),
('Lokaal 4.03', 4),
('Lokaal 4.04', 4),
('Lokaal 4.05', 4),
('Lokaal 4.06', 4);
