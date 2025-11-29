const mysql = require('mysql2/promise');

// MySQL kapcsolat beállítása

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'utazas',
    multipleStatements: true
});




// Adatbázis inicializálása - táblák létrehozása
async function initializeTables() {
    try {
        // Helység tábla
        await db.query(`CREATE TABLE IF NOT EXISTS helyseg (
            az INT PRIMARY KEY,
            nev VARCHAR(255) NOT NULL,
            orszag VARCHAR(255) NOT NULL
        )`);

        // Szálloda tábla
        await db.query(`CREATE TABLE IF NOT EXISTS szalloda (
            az VARCHAR(2) PRIMARY KEY,
            nev VARCHAR(255) NOT NULL,
            besorolas INT,
            helyseg_az INT,
            tengerpart_tav INT,
            repter_tav INT,
            felpanzio TINYINT,
            FOREIGN KEY (helyseg_az) REFERENCES helyseg(az)
  
        )`);

        // Tavasz árak tábla
        await db.query(`CREATE TABLE IF NOT EXISTS tavasz (
            id INT AUTO_INCREMENT PRIMARY KEY,
            szalloda_az VARCHAR(2),
            indulas DATE,
            idotartam INT,
            ar INT,
            FOREIGN KEY (szalloda_az) REFERENCES szalloda(az)
           
        )`);

        //Users tábla
        await db.query(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nev VARCHAR(255),
            email VARCHAR(255) UNIQUE,
            jelszo VARCHAR(255),
            szerepkor VARCHAR(50) DEFAULT 'regisztralt'

        )`);

        // Messages tábla

        await db.query(`CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            content VARCHAR(255),
            \`date\` DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Ensure AUTO_INCREMENT is properly set
        await db.query("ALTER TABLE messages MODIFY COLUMN id INT AUTO_INCREMENT");
        const [rows] = await db.query("SELECT IFNULL(MAX(id), 0) + 1 as nextId FROM messages");
        const nextId = rows[0].nextId;
        await db.query("ALTER TABLE messages AUTO_INCREMENT = ?", [nextId]);

        // Sessions tábla az express-mysql-session számára

        await db.query(`CREATE TABLE IF NOT EXISTS sessions (
            session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
            expires INT(11) UNSIGNED NOT NULL,
            data MEDIUMTEXT COLLATE utf8mb4_bin,
            PRIMARY KEY (session_id)

        )`);

        console.log("✅ Táblák létrehozva");
    } catch (err) {
        console.error("Hiba a táblák létrehozásakor:", err);
    }
}


    


// Adatbetöltés a táblákba
async function initializeData() {
    try {
        // Táblák inicializálása
        await initializeTables();

        // Helység adatok
        const helysegek = [
            [1, "Sousse", "Tunézia"],
            [2, "Djerba", "Tunézia"],
            [3, "Sharm El Sheikh", "Egyiptom"],
            [4, "Hurghada", "Egyiptom"]
        ];

        for (const [az, nev, orszag] of helysegek) {
            await db.query("INSERT IGNORE INTO helyseg (az, nev, orszag) VALUES (?, ?, ?)", [az, nev, orszag]);
        }

        // Szálloda adatok (csak pár példa)
        const szallodak = [
            ["BS", "Baron Resort", 5, 3, 0, 15, 1],
            ["CL", "Charm Life", 3, 4, 0, 33, 0],
            ["CP", "Cesar Palace", 5, 2, 250, 27, 1]
        ];

        for (const [az, nev, besorolas, helyseg_az, tengerpart_tav, repter_tav, felpanzio] of szallodak) {
            await db.query("INSERT IGNORE INTO szalloda (az, nev, besorolas, helyseg_az, tengerpart_tav, repter_tav, felpanzio) VALUES (?, ?, ?, ?, ?, ?, ?)",
                           [az, nev, besorolas, helyseg_az, tengerpart_tav, repter_tav, felpanzio]);
        }

        console.log("✅ Adatbázis inicializálva");
    } catch (err) {
        console.error("Hiba az adatbázis inicializálásakor:", err);
    }
}

// Adatbázis lekérdezések
const database = {
    // Összes helység lekérése
    getHelysegek: async () => {
        try {
            const [rows] = await db.query("SELECT * FROM helyseg ORDER BY orszag, nev");
            return rows;
        } catch (err) {
            throw err;
        }
    },

    // Összes szálloda lekérése
    getSzallodak: async () => {
        try {
            const [rows] = await db.query(`SELECT s.*, h.nev as helyseg_nev, h.orszag
                   FROM szalloda s
                   JOIN helyseg h ON s.helyseg_az = h.az
                   ORDER BY h.orszag, s.nev`);
            return rows;
        } catch (err) {
            throw err;
        }
    },

    // Tavaszi árak lekérése
    getTavaszArak: async () => {
        try {
            const [rows] = await db.query(`SELECT t.*, s.nev as szalloda_nev, h.orszag
                   FROM tavasz t
                   JOIN szalloda s ON t.szalloda_az = s.az
                   JOIN helyseg h ON s.helyseg_az = h.az
                   ORDER BY t.indulas DESC, t.ar`);
            return rows;
        } catch (err) {
            throw err;
        }
    },

    // CRUD MŰVELETEK

    // Összes szálloda lekérése (READ - CRUD-hoz)
    getAllSzallodak: async () => {
        try {
            const [rows] = await db.query(`SELECT s.*, h.nev as helyseg_nev, h.orszag
                   FROM szalloda s
                   JOIN helyseg h ON s.helyseg_az = h.az
                   ORDER BY s.nev`);
            return rows;
        } catch (err) {
            throw err;
        }
    },

    // Egy szálloda lekérése ID alapján (READ)
    getSzallodaById: async (id) => {
        try {
            const [rows] = await db.query(`SELECT s.*, h.nev as helyseg_nev, h.orszag
                   FROM szalloda s
                   JOIN helyseg h ON s.helyseg_az = h.az
                   WHERE s.az = ?`, [id]);
            return rows[0];
        } catch (err) {
            throw err;
        }
    },

    // Új szálloda hozzáadása (CREATE)

    addSzalloda: async (szallodaData, user) => {
        if (!user || user.szerepkor !== 'admin') {
            throw new Error('Csak adminisztrátorok adhatnak hozzá szállodát');
        }
        try {
            const { az, nev, besorolas, helyseg_az, tengerpart_tav, repter_tav, felpanzio } = szallodaData;
            const result = await db.query(`INSERT INTO szalloda (az, nev, besorolas, helyseg_az, tengerpart_tav, repter_tav, felpanzio)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                   [az, nev, besorolas, helyseg_az, tengerpart_tav, repter_tav, felpanzio]);
            return { id: result[0].insertId };
        } catch (err) {
            throw err;
        }
    },

    // Szálloda módosítása (UPDATE)

    updateSzalloda: async (id, szallodaData, user) => {
        if (!user || user.szerepkor !== 'admin') {
            throw new Error('Csak adminisztrátorok módosíthatnak szállodát');
        }
        try {
            const { nev, besorolas, helyseg_az, tengerpart_tav, repter_tav, felpanzio } = szallodaData;
            const result = await db.query(`UPDATE szalloda SET nev = ?, besorolas = ?, helyseg_az = ?,
                   tengerpart_tav = ?, repter_tav = ?, felpanzio = ? WHERE az = ?`,
                   [nev, besorolas, helyseg_az, tengerpart_tav, repter_tav, felpanzio, id]);
            return { changes: result[0].affectedRows };
        } catch (err) {
            throw err;
        }
    },

    // Szálloda törlése (DELETE)
    deleteSzalloda: async (id, user) => {
        if (!user || user.szerepkor !== 'admin') {
            throw new Error('Csak adminisztrátorok törölhetnek szállodát');
        }
        try {
            const result = await db.query("DELETE FROM szalloda WHERE az = ?", [id]);
            return { changes: result[0].affectedRows };
        } catch (err) {
            throw err;
        }
    },

    // Helységek lekérése a dropdown-hoz
    getHelysegekForDropdown: async () => {
        try {
            const [rows] = await db.query("SELECT az, nev, orszag FROM helyseg ORDER BY orszag, nev");
            return rows;
        } catch (err) {
            throw err;
        }
    },

    addUser: async (userData) => {                                                // új felhasználó regisztrációja
        try {
            const { nev, email, jelszo, szerepkor } = userData;
            const result = await db.query(`INSERT INTO users (nev, email, jelszo, szerepkor)
                   VALUES (?, ?, ?, ?)`,
                   [nev, email, jelszo, szerepkor || 'regisztralt']);
            return { id: result[0].insertId };
        } catch (err) {
            throw err;
        }
    },

    // Messages functions
    getUserMessages: async (userId) => {
        try {
            const [rows] = await db.query("SELECT * FROM messages WHERE user_id = ? ORDER BY `date` DESC", [userId]);
            return rows;
        } catch (err) {
            throw err;
        }
    },

    getAllMessages: async () => {
        try {
            const [rows] = await db.query("SELECT m.*, u.nev as user_nev FROM messages m JOIN users u ON m.user_id = u.id ORDER BY m.`date` DESC");
            return rows;
        } catch (err) {
            throw err;
        }
    },

    addMessage: async (messageData) => {
        try {
            const { user_id, content, date } = messageData;
            const result = await db.query("INSERT INTO messages (user_id, content, `date`) VALUES (?, ?, NOW())", [user_id, content, date]);
            return { id: result[0].insertId };
        } catch (err) {
            throw err;
        }
    }


};

module.exports = { db, database, initializeData };