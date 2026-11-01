-- importeer deze file als je de tribespot database al hebt
-- dan hoef je niet alles opnieuw te importeren (en raak je de statussen niet kwijt)

USE tribespot;

CREATE TABLE IF NOT EXISTS berichten (
    id INT AUTO_INCREMENT PRIMARY KEY,
    van_id INT NOT NULL,
    naar_id INT NOT NULL,
    tekst TEXT NOT NULL,
    verstuurd_op DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (van_id) REFERENCES gebruikers(id),
    FOREIGN KEY (naar_id) REFERENCES gebruikers(id)
);
