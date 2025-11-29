const express = require('express');
const router = express.Router();
const { database } = require('../models/database');

// Adatbázis menü főoldala
router.get('/', async (req, res) => {
    try {
        console.log('✅ Adatbázis oldal betöltése...');
        
        // Összes adat lekérése párhuzamosan
        const [helysegek, szallodak, tavaszArak] = await Promise.all([
            database.getHelysegek(),
            database.getSzallodak(),
            database.getTavaszArak()
        ]);

        console.log(`✅ Adatok betöltve: ${helysegek.length} helyseg, ${szallodak.length} szalloda, ${tavaszArak.length} tavasz`);

        res.render('adatbazis', {
            title: 'Ajánlatok',
            user: req.user,
            currentPage: 'adatbazis',
            helysegek: helysegek,
            szallodak: szallodak,
            tavaszArak: tavaszArak
        });
    } catch (error) {
        console.error('❌ Adatbázis hiba:', error);
        res.render('adatbazis', {
            title: 'Ajánlatok',
            user: req.user,
            currentPage: 'adatbazis',
            helysegek: [],
            szallodak: [],
            tavaszArak: [],
            error: 'Hiba az adatok betöltése során'
        });
    }
});

module.exports = router;