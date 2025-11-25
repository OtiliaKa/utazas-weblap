const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

// Route-ok importálása
const adatbazisRoutes = require('./routes/adatbazis');

const app = express();
const PORT = 3000;

// Middleware-ek
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Session beállítás
app.use(session({
    secret: 'napfeny-tours-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// View engine beállítás
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routing
app.get('/', (req, res) => {
    res.render('fooldal', { 
        title: 'Főoldal',
        user: req.session.user,
        currentPage: 'fooldal'
    });
});

app.get('/kapcsolat', (req, res) => {
    res.render('kapcsolat', { 
        title: 'Kapcsolat',
        user: req.session.user,
        currentPage: 'kapcsolat'
    });
});

app.get('/crud', (req, res) => {
    res.render('crud', { 
        title: 'Szállodák',
        user: req.session.user,
        currentPage: 'crud'
    });
});

//ADATBÁZIS ROUTE - EZ FOGJA KEZELNI AZ /adatbazis ÚTVONALAT 
app.use('/adatbazis', adatbazisRoutes);

// Ideiglenes route-ok a hiányzó oldalakhoz
app.get('/bejelentkezes', (req, res) => {
    res.send('Bejelentkezés oldal - készülőben...');
});

app.get('/regisztracio', (req, res) => {
    res.send('Regisztráció oldal - készülőben...');
});

app.get('/uzenetek', (req, res) => {
    res.send('Üzenetek oldal - készülőben...');
});

app.get('/admin', (req, res) => {
    res.send('Admin oldal - készülőben...');
});

app.get('/kijelentkezes', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Szerver indítása
app.listen(PORT, () => {
    console.log(`✅ A szerver fut a http://localhost:${PORT} címen`);
    console.log(`📁 A projekt mappa: ${__dirname}`);
});