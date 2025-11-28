const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Obsługa plików statycznych (DUŻE P, aby pasowało do GitHuba)
app.use(express.static(path.join(__dirname, 'Public')));

// --- 1. DEKLARACJA BAZY DANYCH ---
// Używamy folderu tymczasowego /tmp
const dbPath = path.join('/tmp', 'luna.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Błąd otwarcia bazy:', err.message);
        process.exit(1); // Wyłącz aplikację w razie krytycznego błędu
    }
});

// --- 2. API (Endpoints) ---
// Definiujemy endpointy, które będą używać bazy
app.post('/api/login', (req, res) => {
    const { name } = req.body;
    db.get("SELECT * FROM users WHERE name = ?", [name], (err, row) => {
        if (err) {
            console.error("BŁĄD LOGOWANIA:", err.message);
            return res.status(500).json({ error: "Błąd bazy danych przy logowaniu." });
        }
        if (row) {
            res.json({ message: `Witaj z powrotem, ${name}!`, user: row });
        } else {
            db.run("INSERT INTO users (name, stars) VALUES (?, 0)", [name], function (err) {
                if (err) return res.status(500).json({ error: "Błąd tworzenia konta." });
                db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (err, newRow) => {
                    res.json({ message: `Cześć ${name}, założono nowe konto!`, user: newRow });
                });
            });
        }
    });
});

app.post('/api/save-progress', (req, res) => {
    const { userId, stars, visual, auditory, tactile, memory } = req.body;
    const sql = `UPDATE users SET 
                 stars = ?, visual_score = ?, auditory_score = ?, tactile_score = ?, memory_score = ?
                 WHERE id = ?`;
    db.run(sql, [stars, visual, auditory, tactile, memory, userId], function (err) {
        if (err) return res.status(500).json({ error: "Błąd zapisu postępów." });
        res.json({ success: true });
    });
});

app.get('/api/user/:id', (req, res) => {
    db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: "Błąd pobierania danych." });
        res.json(row);
    });
});


// --- ASYNCHRONICZNY WARTOWNIK ---
// Serwer startuje TYLKO I WYŁĄCZNIE, gdy baza jest gotowa.
db.serialize(() => {
    // 1. Tworzymy tabelę Users (Gwarancja, że struktura istnieje)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        stars INTEGER DEFAULT 0,
        visual_score INTEGER DEFAULT 0,
        auditory_score INTEGER DEFAULT 0,
        tactile_score INTEGER DEFAULT 0,
        memory_score INTEGER DEFAULT 0
    )`);

    // 2. STARTUJEMY SERWER DOPIERO TUTAJ
    app.listen(PORT, () => {
        console.log(`🚀 Serwer Node.js działa na porcie ${PORT}!`);
        console.log(`📦 Baza danych podłączona w: ${dbPath}`); // Ta linia musi być wewnątrz
    });
});