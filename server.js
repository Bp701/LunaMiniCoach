const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
// Ustawiamy port na 3001, chyba że serwer (Render) narzuci inny
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Obsługa plików statycznych (Zwróć uwagę na duże 'P' w Public - tak jak masz na dysku)
app.use(express.static(path.join(__dirname, 'Public')));

// --- KONFIGURACJA BAZY DANYCH (SQLite) ---
// Tworzymy plik bazy danych w folderze projektu
const dbPath = path.join(__dirname, 'luna.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Błąd otwarcia bazy danych:', err.message);
    } else {
        console.log(`📦 Baza danych SQLite podłączona: ${dbPath}`);
    }
});

// Tworzymy tabelę Users (jeśli nie istnieje)
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

// --- API (Endpoints) ---

// 1. LOGOWANIE / REJESTRACJA
app.post('/api/login', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Brak imienia" });

    db.get("SELECT * FROM users WHERE name = ?", [name], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            res.json({ message: `Witaj ponownie, ${name}!`, user: row });
        } else {
            db.run("INSERT INTO users (name) VALUES (?)", [name], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (err, newRow) => {
                    res.json({ message: `Utworzono profil pacjenta: ${name}`, user: newRow });
                });
            });
        }
    });
});

// 2. ZAPIS WYNIKÓW (HealthTech Data)
app.post('/api/save-progress', (req, res) => {
    const { userId, stars, visual, auditory, tactile, memory } = req.body;

    const sql = `UPDATE users SET 
                 stars = ?, visual_score = ?, auditory_score = ?, tactile_score = ?, memory_score = ?
                 WHERE id = ?`;

    db.run(sql, [stars, visual, auditory, tactile, memory, userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Dane kliniczne zaktualizowane" });
    });
});

// 3. POBIERANIE DANYCH PACJENTA
app.get('/api/user/:id', (req, res) => {
    db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

// Start serwera
app.listen(PORT, () => {
    console.log(`\n🚀 Luna System (HealthTech Core) działa na: http://localhost:${PORT}`);
    console.log(`👉 Baza danych: SQLite (Lokalna)\n`);
});