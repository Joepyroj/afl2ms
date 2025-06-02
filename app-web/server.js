// app-web/server.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.APP_PORT || 3001; // Port internal untuk aplikasi Node.js
const JWT_SECRET = process.env.JWT_SECRET || 'rahasiaSuperDuperJWT';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Konfigurasi koneksi database
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'testdb',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

async function initializeDatabase() {
    try {
        // Membuat koneksi tanpa menentukan database terlebih dahulu untuk membuat database jika belum ada
        const tempConnection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            port: dbConfig.port
        });
        await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
        await tempConnection.end();
        console.log(`Database '${dbConfig.database}' checked/created successfully.`);

        // Sekarang buat pool koneksi dengan database yang sudah ditentukan
        pool = mysql.createPool(dbConfig);

        // Membuat tabel jika belum ada
        const createUserTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(createUserTableQuery);
        console.log("Table 'users' checked/created successfully.");
    } catch (error) {
        console.error("Error during database initialization:", error.message);
        // Tunggu beberapa saat lalu coba lagi, ini berguna saat startup dengan Docker Compose
        // dimana database mungkin belum siap sepenuhnya.
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            console.log('Retrying database connection in 5 seconds...');
            setTimeout(initializeDatabase, 5000);
        } else {
            process.exit(1); // Keluar jika error lain
        }
    }
}


// Endpoint untuk Registrasi
app.post('/api/register', async (req, res) => {
    if (!pool) return res.status(503).json({ message: "Database not initialized yet." });
    const { username, password, confirmPassword } = req.body;

    if (!username || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Semua field harus diisi!' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Password dan konfirmasi password tidak cocok!' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password minimal 6 karakter!' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'Registrasi berhasil!', userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username sudah digunakan!' });
        }
        console.error("Error during registration:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// Endpoint untuk Login
app.post('/api/login', async (req, res) => {
    if (!pool) return res.status(503).json({ message: "Database not initialized yet." });
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password harus diisi!' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        const user = rows[0];
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login berhasil!', token, username: user.username });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// Middleware untuk verifikasi token JWT (sederhana)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // Jika tidak ada token

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Jika token tidak valid
        req.user = user;
        next();
    });
}

// Endpoint untuk mendapatkan data pengguna (contoh endpoint terproteksi)
app.get('/api/user', authenticateToken, (req, res) => {
    if (!pool) return res.status(503).json({ message: "Database not initialized yet." });
    // req.user berisi payload dari JWT (id, username)
    res.json({ id: req.user.id, username: req.user.username });
});

// Endpoint health check untuk load balancer
app.get('/health', (req, res) => {
    if (pool && pool._allConnections && pool._allConnections.length > 0) { // Cek sederhana apakah pool ada
        res.status(200).send('OK');
    } else {
        res.status(503).send('Service Unavailable: Database connection issue.');
    }
});


// Jalankan server setelah database siap
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server aplikasi web berjalan di http://localhost:${PORT} (internal)`);
        console.log(`Terhubung ke DB Host: ${dbConfig.host}`);
    });
}).catch(err => {
    console.error("Gagal menjalankan server karena database:", err);
});
