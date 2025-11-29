const express = require('express');
const path = require('path');
const cors = require('cors');
// Zmieniamy bibliotekę z sqlite3 na pg (PostgreSQL)
const { Client } = require('pg');
const bodyParser = require('body-parser');

const app = express();
// Używamy portu narzuconego przez Render
const PORT = process.env.PORT;
// Render automatycznie generuje ten URL
const DATABASE_URL = process.env.DATABASE_URL;

// --- 1. POŁĄCZENIE Z BAZĄ DANYCH ---
// Klient Postgres
const client = new Client({
    connectionString: DATABASE_URL, // Render automatycznie wstrzyknie klucz połączenia
    ssl: {
        rejectUnauthorized: false // Wymagane dla połączeń Render-to-Render
    }
});

// Własna funkcja, która czeka na połączenie i startuje serwer
async function connectAndStartServer() {
    try {
        await client.connect(); // Łączymy się z bazą
        console.log('✅ Połączono z bazą danych PostgreSQL!');

        // Gwarantujemy, że tabela istnieje
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE,
                stars INTEGER DEFAULT 0,
                visual_score INTEGER DEFAULT 0,
                auditory_score INTEGER DEFAULT 0,
                tactile_score INTEGER DEFAULT 0,
                memory_score INTEGER DEFAULT 0
            );
        `);
        console.log('📦 Tabela USERS jest gotowa.');

        // STARTUJEMY SERWER DOPIERO TUTAJ
        app.listen(PORT, () => {
            console.log(`🚀 Serwer Node.js działa na porcie ${PORT}!`);
        });

    } catch (err) {
        console.error('❌ Błąd krytyczny przy starcie serwera/DB:', err);
        process.exit(1);
    }
}

// --- 2. MIDDLEWARE i PLIKI STATYCZNE ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'Public')));

// --- 3. API (Endpointy) ---

// Logowanie / Rejestracja
app.post('/api/login', async (req, res) => {
    const { name } = req.body;
    try {
        let result = await client.query('SELECT * FROM users WHERE name = $1', [name]);
        let user;

        if (result.rows.length > 0) {
            user = result.rows[0]; // Użytkownik istnieje
        } else {
            // Nowy użytkownik - tworzenie konta
            result = await client.query('INSERT INTO users (name, stars) VALUES ($1, 0) RETURNING *', [name]);
            user = result.rows[0];
        }
        res.json({ message: `Witaj z powrotem, ${name}!`, user });
    } catch (err) {
        console.error('BŁĄD API LOGOWANIA:', err);
        res.status(500).json({ error: "Błąd bazy danych przy logowaniu." });
    }
});

// Zapis Postępów
app.post('/api/save-progress', async (req, res) => {
    const { userId, stars, visual, auditory, tactile, memory } = req.body;
    const sql = `UPDATE users SET 
                 stars = $1, visual_score = $2, auditory_score = $3, tactile_score = $4, memory_score = $5
                 WHERE id = $6`;
    try {
        await client.query(sql, [stars, visual, auditory, tactile, memory, userId]);
        res.json({ success: true });
    } catch (err) {
        console.error('BŁĄD API ZAPISU:', err);
        res.status(500).json({ error: "Błąd zapisu postępów." });
    }
});

app.get('/api/user/:id', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Błąd pobierania danych." });
    }
});

// URUCHOMIENIE FUNKCJI STARTOWEJ
connectAndStartServer();