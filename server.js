const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Obsługa plików statycznych (Folder Public)
app.use(express.static(path.join(__dirname, 'Public')));

// Baza danych
const dbPath = path.join(__dirname, 'luna.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('DB Error:', err.message);
    else console.log('📦 Baza danych Connected');
});

// Inicjalizacja tabel
db.serialize(() => {
    // Tabela użytkowników
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        stars INTEGER DEFAULT 0,
        visual_score INTEGER DEFAULT 0,
        auditory_score INTEGER DEFAULT 0,
        tactile_score INTEGER DEFAULT 0,
        memory_score INTEGER DEFAULT 0
    )`);

    // NOWA TABELA: Puls Dnia (Logi)
    db.run(`CREATE TABLE IF NOT EXISTS daily_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        date TEXT,
        mood INTEGER,
        tags TEXT,
        note TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

// --- API ---

// Logowanie
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

// Zapis postępów w grach
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

// Pobranie danych użytkownika
app.get('/api/user/:id', (req, res) => {
    db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, row) => {
        if (err) res.status(500).send(err);
        else res.json(row);
    });
});

// --- PULS DNIA API ---

// Zapisz wpis dziennika
app.post('/api/logs', (req, res) => {
    const { userId, date, mood, tags, note } = req.body;
    const tagsString = JSON.stringify(tags);
    db.run(`INSERT INTO daily_logs (user_id, date, mood, tags, note) VALUES (?, ?, ?, ?, ?)`,
        [userId, date, mood, tagsString, note],
        function (err) {
            if (err) res.status(500).json({ error: err.message });
            else res.json({ success: true, id: this.lastID });
        }
    );
});

// Pobierz historię do PDF
app.get('/api/logs/:userId', (req, res) => {
    db.all("SELECT * FROM daily_logs WHERE user_id = ? ORDER BY id DESC LIMIT 30", [req.params.userId], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));