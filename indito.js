
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
let session = require('express-session');
const usersRoutes = require("./routes/users");
const passport=require('passport');
const LocalStrategy=require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
var MySQLStore = require('express-mysql-session')(session);
const { db, database, initializeData } = require('./models/database');


// Route-ok importálása
const adatbazisRoutes = require('./routes/adatbazis');
const crudRoutes = require('./routes/crud');
const uzenetekRoutes = require('./routes/uzenetek');

const app = express();
const PORT = 4116;

// Middleware-ek
app.use(session({                                       // definiáljuk a session middleware-t
        key: 'session_cookie_name',                             // ezt használjuk a Cookie-ban
        secret: 'session_cookie_secret',

// A user datbázisban tároljuk a Session adatokat:
        store: new MySQLStore({
        host:'localhost',
        user:'studb116',
        password: "abc123",
        database:'db116'
        }),
        resave: false,
        saveUninitialized: false,
        cookie:{
        maxAge:1000*60*60*24,
        }
        }));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(bodyParser.json());                                 // A Body-parser middleware-t bejövő adatok elemzésére használja a passport, itt inicializáljuk azt
app.use(bodyParser.urlencoded({ extended: true }));

// Content Security Policy
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;");
    next();
});

// Passport Local Strategy konfiguráció
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'jelszo'
}, async (email, jelszo, done) => {
    try {
        // Felhasználó keresése az adatbázisban
        const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (results.length === 0) {
            return done(null, false, { message: 'Hibás email vagy jelszó!' });
        }

        const user = results[0];

        // Ellenőrizzük, hogy van-e jelszó hash
        if (!user.jelszo) {
            return done(null, false, { message: 'Hibás email vagy jelszó!' });
        }

        // Jelszó ellenőrzése
        const isValidPassword = await bcrypt.compare(jelszo, user.jelszo);
        if (!isValidPassword) {
            return done(null, false, { message: 'Hibás email vagy jelszó!' });
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Passport serialization
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Passport deserialization
passport.deserializeUser(async (id, done) => {
    try {
        const [results] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (results.length === 0) return done(null, false);
        done(null, results[0]);
    } catch (error) {
        done(error);
    }
});

// View engine beállítás
app.use(express.static('public'));
app.use('/app116', express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routing
app.get('/', (req, res) => {
    res.render('fooldal', {
        title: 'Főoldal',
        user: req.user,
        currentPage: 'fooldal'
    });
});

app.get('/kapcsolat', (req, res) => {
    res.render('kapcsolat', {
        title: 'Kapcsolat',
        user: req.user,
        currentPage: 'kapcsolat'
    });
});

//ADATBÁZIS ROUTE - EZ FOGJA KEZELNI AZ /adatbazis ÚTVONALAT
app.use('/adatbazis', adatbazisRoutes);

app.use('/crud', crudRoutes);                               // CRUD ROUTE - EZ FOGJA KEZELNI AZ /crud ÚTVONALAT

app.use('/uzenetek', uzenetekRoutes);                        // UZENETEK ROUTE - EZ FOGJA KEZELNI AZ /uzenetek ÚTVONALAT

// Ideiglenes route-ok a hiányzó oldalakhoz

app.use("/fiok", usersRoutes);

app.get('/app116/fiok/regisztracio', (req, res) => {
        res.render('regisztracio', {
        title: 'Fiók',
        user: req.user,
        currentPage: 'regisztracio' })                     // need regisztracio.ejs here
    });


app.get('/app116/fiok/bejelentkezes', (req, res) => {
    res.render('bejelentkezes', {
        title: 'Fiók',
        user: req.user,
        currentPage: 'bejelentkezes' })                     // need bejelentkezes.ejs here
    });


app.get('/app116/fiok/login-failure', (req, res, next) => {
    res.send('You entered the wrong password.');
});

app.get('/app116/login-success', (req, res, next) => {
    res.redirect('/protected-route');
    res.render("Üdvözöljük," + user.name);
});


app.get('/app116/protected-route',isAuth,(req, res, next) => {
    const isAdmin = req.user && req.user.szerepkor === 'admin';
    res.render("protected", {
        isAdmin: isAdmin, userName: req.user.nev
   });
});

function isAuth(req,res,next)
{
    if(req.isAuthenticated())
        next();
    else
        res.redirect('/app116/notAuthorized');
}

app.get('/app116/notAuthorized', (req, res, next) => {
    console.log("Inside get");
    res.send('<h1>You are not authorized to view the resource </h1><p><a href="/login">Retry Login</a></p>');
    
});

app.get('/app116/admin', async (req, res) => {
    if (!req.user || req.user.szerepkor !== 'admin') {
        return res.render('admin', {
            title: 'Admin',
            user: req.user,
            currentPage: 'admin',
            error: 'Csak adminisztrátorok férhetnek hozzá ehhez az oldalhoz',
            messages: []
        });
    }
    try {
        const messages = await database.getAllMessages();
        res.render('admin', {
            title: 'Admin',
            user: req.user,
            currentPage: 'admin',
            messages: messages,
            error: null
        });
    } catch (error) {
        res.render('admin', {
            title: 'Admin',
            user: req.user,
            currentPage: 'admin',
            messages: [],
            error: 'Hiba az üzenetek betöltése során'
        });
    }
});





// Szerver indítása az adatbázis inicializálása után
initializeData().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ A szerver fut a http://localhost:${PORT} címen`);
        console.log(`📁 A projekt mappa: ${__dirname}`);
    });
}).catch(err => {
    console.error('Hiba az adatbázis inicializálásakor:', err);
});