const express = require('express');
const router = express.Router();
const { database } = require('../models/database');

router.get('/', async (req, res) => {
    if (!req.user) {
        return res.redirect('/bejelentkezes');
    }

    try {
        let messages;
        if (req.user.szerepkor === 'admin') {
            messages = await database.getAllMessages();
        } else {
            messages = await database.getUserMessages(req.user.id);
        }

        res.render('uzenetek', {
            title: 'Üzenetek',
            user: req.user,
            currentPage: 'uzenetek',
            messages: messages
        });
    } catch (error) {
        console.error('Hiba az üzenetek betöltésekor:', error);
        res.render('uzenetek', {
            title: 'Üzenetek',
            user: req.user,
            currentPage: 'uzenetek',
            messages: [],
            error: 'Hiba az üzenetek betöltésekor'
        });
    }
});

router.post('/', async (req, res) => {
    if (!req.user) {
        return res.redirect('/bejelentkezes');
    }

    const { content } = req.body;
    const date = new Date().toISOString().split('T')[0];

    try {
        await database.addMessage({
            user_id: req.user.id,
            content: content,
            date: date
        });
        res.redirect('/uzenetek');
    } catch (error) {
        console.error('Hiba az üzenet küldésekor:', error);
        res.redirect('/uzenetek?error=Hiba az üzenet küldésekor');
    }
});

module.exports = router;