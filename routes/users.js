const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../models/database");

router.get("/regisztracio", (req, res) => {                                 // regisztráció
    res.render("regisztracio", {
        title: "Regisztráció",
        user: req.session.user,
        currentPage: "regisztracio"
    });
});

router.post("/regisztracio", async (req, res) => {
    const { nev, email, jelszo } = req.body;

    const hashed = await bcrypt.hash(jelszo, 10);

    db.query(
        "INSERT INTO users (nev, email, jelszo, szerepkor) VALUES (?, ?, ?, 'regisztralt')",
        [nev, email, hashed],
        (err) => {
            if (err) throw err;
            res.redirect("/bejelentkezes");
        }
    );
});

router.get("/bejelentkezes", (req, res) => {                                    // bejelentkezés
    res.render("bejelentkezes", {
        title: "Bejelentkezés",
        user: req.session.user,
        currentPage: "bejelentkezes",
        error: null
    });
});

router.post("/bejelentkezes", (req, res) => {
    const { email, jelszo } = req.body;

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, results) => {
            if (err) throw err;

            if (results.length === 0) {
                return res.render("bejelentkezes", {
                    title: "Bejelentkezés",
                    user: null,
                    currentPage: "bejelentkezes",
                    error: "Hibás email vagy jelszó!"
                });
            }

            const user = results[0];
            const match = await bcrypt.compare(jelszo, user.jelszo);

            if (!match) {
                return res.render("bejelentkezes", {
                    title: "Bejelentkezés",
                    user: null,
                    currentPage: "bejelentkezes",
                    error: "Hibás email vagy jelszó!"
                });
            }

            req.session.user = {                                                // sikeres bejelentkezés
                id: user.id,
                nev: user.nev,
                szerepkor: user.szerepkor
            };

            res.redirect("/");
        }
    );
});

router.get("/kijelentkezes", (req, res) => {                                    // kijelentkezés
    req.session.destroy(() => {
        res.redirect("/");                                                      //kijelentkezés után a főoldalra irányít
    });
});

module.exports = router;
