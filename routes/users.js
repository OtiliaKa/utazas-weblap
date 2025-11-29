const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const { db } = require("../models/database");

router.get("/regisztracio", (req, res) => {                                 // regisztráció
    res.render("regisztracio", {
        title: "Regisztráció",
        user: req.user,
        currentPage: "regisztracio"
    });
});

router.post("/regisztracio", async (req, res) => {
    const { nev, email, jelszo } = req.body;

    const hashed = await bcrypt.hash(jelszo, 10);

    try {
        await db.query(
            "INSERT INTO users (nev, email, jelszo, szerepkor) VALUES (?, ?, ?, 'regisztralt')",
            [nev, email, hashed]
        );
        res.redirect("/bejelentkezes");
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).send("Hiba történt a regisztráció során");
    }
});

router.get("/bejelentkezes", (req, res) => {                                // bejelentkezés
    res.render("bejelentkezes", {
        title: "Bejelentkezés",
        user: req.user,
        currentPage: "bejelentkezes",
        error: req.flash ? req.flash('error') : null
    });
});

router.post("/bejelentkezes", passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/bejelentkezes',
    failureFlash: true
}));

router.get("/kijelentkezes", (req, res) => {                                    // kijelentkezés
    req.logout((err) => {
        if (err) return next(err);
        res.redirect("/");                                                      //kijelentkezés után a főoldalra irányít
    });
});

module.exports = router;
