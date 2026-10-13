-- Active: 1791882569341@@127.0.0.1@3306@tribespot
--@block
CREATE TABLE Users(
    id INT PRIMARY KEY AUTO_INCREMENT,
    naam VARCHAR(255),
    gebruikersnaam VARCHAR(255),
    HUemail VARCHAR(255),
    wachtwoord VARCHAR(255)
);