-- notities voor als je niks begrijpt van SQL.
-- als je xampp controll panel open hebt en je apache en sql goed heb opgezet
-- druk in XAMPP bij Apache op Start
-- draait het goed? ja ga verder met deze stappenplan zo niet fix dat
-- druk bij MySQL op Admin. phpMyAdmin opent in je browser
-- druk boven bij die navbar op importeren en doe deze file erin
-- dan krijg je links bij die sidebar een tribespot database met deze gegevens hieronder 
-- en met Node.js (mysql2) maken we verbinding met de database 


CREATE DATABASE IF NOT EXISTS tribespot CHARACTER SET utf8mb4;
USE tribespot;

DROP TABLE IF EXISTS statussen;
DROP TABLE IF EXISTS gebruikers;
DROP TABLE IF EXISTS lokalen;

CREATE TABLE gebruikers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    naam VARCHAR(100) NOT NULL
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
    gedeeld_op DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gebruiker_id) REFERENCES gebruikers(id),
    FOREIGN KEY (lokaal_id) REFERENCES lokalen(id)
);

INSERT INTO gebruikers (naam) VALUES ('sanne');
INSERT INTO gebruikers (naam) VALUES ('mo');
INSERT INTO gebruikers (naam) VALUES ('lisa');
INSERT INTO gebruikers (naam) VALUES ('daan');
INSERT INTO gebruikers (naam) VALUES ('yara');
INSERT INTO gebruikers (naam) VALUES ('ahmed');

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


INSERT INTO statussen (gebruiker_id, lokaal_id, werkt_aan, beschikbaarheid, tot) VALUES (1, 13, 'Plattegrond', 'aanschuiven', '15:00');
INSERT INTO statussen (gebruiker_id, lokaal_id, werkt_aan, beschikbaarheid, tot) VALUES (2, 13, 'Python opdracht', 'focus', '12:00');
INSERT INTO statussen (gebruiker_id, lokaal_id, werkt_aan, beschikbaarheid, tot) VALUES (3, 14, 'Database', 'vragen', '16:00');
INSERT INTO statussen (gebruiker_id, lokaal_id, werkt_aan, beschikbaarheid, tot) VALUES (4, 15, 'Webdevelopment', 'aanschuiven', '14:00');

