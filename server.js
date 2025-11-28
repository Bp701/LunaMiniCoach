const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'Public')));

// BAZA DANYCH
const db = new sqlite3.Database('./luna.db', (err) => {
    if (err) console.error(err.message);
    else console.log('📦 Baza danych podłączona.');
});

// Nowa tabela z kolumną 'name' (unikalną)
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

// --- API ---

// 1. LOGOWANIE / REJESTRACJA
app.post('/api/login', (req, res) => {
    const { name } = req.body;
    // Sprawdź czy dziecko istnieje
    db.get("SELECT * FROM users WHERE name = ?", [name], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            // Dziecko istnieje - zwracamy jego dane
            res.json({ message: `Witaj z powrotem, ${name}!`, user: row });
        } else {
            // Nowe dziecko - tworzymy konto
            db.run("INSERT INTO users (name) VALUES (?)", [name], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                // Pobieramy nowo utworzone dane
                db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (err, newRow) => {
                    res.json({ message: `Cześć ${name}, założono nowe konto!`, user: newRow });
                });
            });
        }
    });
});

// 2. ZAPIS POSTĘPÓW (Dla konkretnego ID)
app.post('/api/save-progress', (req, res) => {
    const { userId, stars, visual, auditory, tactile, memory } = req.body;

    const sql = `UPDATE users SET 
                 stars = ?, visual_score = ?, auditory_score = ?, tactile_score = ?, memory_score = ?
                 WHERE id = ?`;

    db.run(sql, [stars, visual, auditory, tactile, memory, userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// 3. POBIERANIE DANYCH (Dla Dashboardu)
app.get('/api/user/:id', (req, res) => {
    db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Serwer działa na http://localhost:${PORT}`);
});