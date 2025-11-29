const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// 🚨 WAŻNE: Tutaj jest "Public" z dużej litery, tak jak Twój folder
app.use(express.static(path.join(__dirname, 'Public')));

// Baza danych (plik lokalny)
const dbPath = path.join(__dirname, 'luna.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('DB Error:', err.message);
    else console.log('📦 Baza danych Connected');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        stars INTEGER DEFAULT 0,
        visual_score INTEGER DEFAULT 0,
        auditory_score INTEGER DEFAULT 0,
        tactile_score INTEGER DEFAULT 0,
        memory_score INTEGER DEFAULT 0
    )`);
});

// API
app.post('/api/login', (req, res) => {
    const { name } = req.body;
    db.get("SELECT * FROM users WHERE name = ?", [name], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ message: "Witaj ponownie", user: row });
        } else {
            db.run("INSERT INTO users (name) VALUES (?)", [name], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (e, r) => res.json({ message: "Nowe konto", user: r }));
            });
        }
    });
});

app.post('/api/save-progress', (req, res) => {
    const { userId, stars, visual, auditory, tactile, memory } = req.body;
    db.run(`UPDATE users SET stars=?, visual_score=?, auditory_score=?, tactile_score=?, memory_score=? WHERE id=?`,
        [stars, visual, auditory, tactile, memory, userId],
        (err) => {
            if (err) res.status(500).json({ error: err.message });
            else res.json({ success: true });
        }
    );
});

app.get('/api/user/:id', (req, res) => {
    db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, row) => {
        if (err) res.status(500).send(err);
        else res.json(row);
    });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));