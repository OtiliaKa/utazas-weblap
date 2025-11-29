const express = require('express');
const router = express.Router();
const { database } = require('../models/database');

// CRUD főoldal - összes szálloda listázása (READ)
router.get('/', async (req, res) => {
    try {
        const szallodak = await database.getAllSzallodak();
        const helysegek = await database.getHelysegekForDropdown();
        
        res.render('crud', {
            title: 'Szálloda Kezelés',
            user: req.user,
            currentPage: 'crud',
            szallodak: szallodak,
            helysegek: helysegek,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('CRUD hiba:', error);
        res.render('crud', {
            title: 'Szálloda Kezelés',
            user: req.user,
            currentPage: 'crud',
            szallodak: [],
            helysegek: [],
            error: 'Hiba az adatok betöltése során'
        });
    }
});

// Új szálloda űrlap (CREATE - űrlap)
router.get('/uj', async (req, res) => {
    try {
        const helysegek = await database.getHelysegekForDropdown();
        
        res.render('crud-uj', {
            title: 'Új Szálloda',
            user: req.user,
            currentPage: 'crud',
            helysegek: helysegek
        });
    } catch (error) {
        res.redirect('/crud?error=Hiba az űrlap betöltése során');
    }
});

// Új szálloda mentése (CREATE - mentés)
router.post('/uj', async (req, res) => {
    try {
        await database.addSzalloda(req.body);
        res.redirect('/crud?success=Szálloda sikeresen hozzáadva');
    } catch (error) {
        res.redirect('/crud?error=Hiba a szálloda hozzáadása során');
    }
});

// Szálloda szerkesztése (UPDATE - űrlap)
router.get('/szerkesztes/:id', async (req, res) => {
    try {
        const szalloda = await database.getSzallodaById(req.params.id);
        const helysegek = await database.getHelysegekForDropdown();
        
        if (!szalloda) {
            return res.redirect('/crud?error=Szálloda nem található');
        }
        
        res.render('crud-szerkesztes', {
            title: 'Száloda Szerkesztése',
            user: req.user,
            currentPage: 'crud',
            szalloda: szalloda,
            helysegek: helysegek
        });
    } catch (error) {
        res.redirect('/crud?error=Hiba a szerkesztés betöltése során');
    }
});

// Szálloda módosítása (UPDATE - mentés)
router.post('/szerkesztes/:id', async (req, res) => {
    try {
        await database.updateSzalloda(req.params.id, req.body);
        res.redirect('/crud?success=Szálloda sikeresen módosítva');
    } catch (error) {
        res.redirect('/crud?error=Hiba a szálloda módosítása során');
    }
});

// Szálloda törlése (DELETE)
router.post('/torles/:id', async (req, res) => {
    try {
        await database.deleteSzalloda(req.params.id);
        res.redirect('/crud?success=Szálloda sikeresen törölve');
    } catch (error) {
        res.redirect('/crud?error=Hiba a szálloda törlése során');
    }
});

module.exports = router;