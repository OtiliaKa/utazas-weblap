const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Adatbázis fájl elérési útja
const dbPath = path.join(__dirname, 'utazas.db');
const db = new sqlite3.Database(dbPath);

// Adatbázis inicializálása - táblák létrehozása
db.serialize(() => {
    // Helység tábla
    db.run(`CREATE TABLE IF NOT EXISTS helyseg (
        az INTEGER PRIMARY KEY,
        nev TEXT NOT NULL,
        orszag TEXT NOT NULL
    )`);

    // Szálloda tábla
    db.run(`CREATE TABLE IF NOT EXISTS szalloda (
        az TEXT PRIMARY KEY,
        nev TEXT NOT NULL,
        besorolas INTEGER,
        helyseg_az INTEGER,
        tengerpart_tav INTEGER,
        repter_tav INTEGER,
        felpanzio INTEGER,
        FOREIGN KEY (helyseg_az) REFERENCES helyseg(az)
    )`);

    // Távasz árak tábla
    db.run(`CREATE TABLE IF NOT EXISTS tavasz (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        szalloda_az TEXT,
        indulas DATE,
        idotartam INTEGER,
        ar INTEGER,
        FOREIGN KEY (szalloda_az) REFERENCES szalloda(az)
    )`);
});

// Adatbetöltés a táblákba
function initializeData() {
    // Helység adatok
    const helysegek = [
        [1, "Sousse", "Tunézia"],
        [2, "Djerba", "Tunézia"], 
        [3, "Sharm El Sheikh", "Egyiptom"],
        [4, "Hurghada", "Egyiptom"]
    ];

    helysegek.forEach(([az, nev, orszag]) => {
        db.run("INSERT OR IGNORE INTO helyseg (az, nev, orszag) VALUES (?, ?, ?)", [az, nev, orszag]);
    });

    // Szálloda adatok (csak pár példa)
    const szallodak = [
        ["BS", "Baron Resort", 5, 3, 0, 15, 1],
        ["CL", "Charm Life", 3, 4, 0, 33, 0],
        ["CP", "Cesar Palace", 5, 2, 250, 27, 1]
    ];

    szallodak.forEach(([az, nev, besorolas, helyseg_az, tengerpart_tav, repter_tav, felpanzio]) => {
        db.run("INSERT OR IGNORE INTO szalloda (az, nev, besorolas, helyseg_az, tengerpart_tav, repter_tav, felpanzio) VALUES (?, ?, ?, ?, ?, ?, ?)", 
               [az, nev, besorolas, helyseg_az, tengerpart_tav, repter_tav, felpanzio]);
    });

    console.log("✅ Adatbázis inicializálva");
}

// Adatbázis lekérdezések
const database = {
    // Összes helység lekérése
    getHelysegek: () => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM helyseg ORDER BY orszag, nev", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // Összes szálloda lekérése
    getSzallodak: () => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT s.*, h.nev as helyseg_nev, h.orszag 
                   FROM szalloda s 
                   JOIN helyseg h ON s.helyseg_az = h.az 
                   ORDER BY h.orszag, s.nev`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // Tavaszi árak lekérése
    getTavaszArak: () => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT t.*, s.nev as szalloda_nev, h.orszag
                   FROM tavasz t 
                   JOIN szalloda s ON t.szalloda_az = s.az 
                   JOIN helyseg h ON s.helyseg_az = h.az 
                   ORDER BY t.indulas DESC, t.ar`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

// Adatbázis inicializálása indításkor
setTimeout(initializeData, 1000);

module.exports = database;