const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Serviamo i file statici dalla cartella public
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.use(express.static(__dirname));

// --- ROTTE SPECIALI PWA ---
app.get('/sw.js', (req, res) => {
    res.sendFile(path.join(publicPath, 'sw.js'));
});

app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(publicPath, 'manifest.json'));
});

// --- ENDPOINT API ---
app.get('/api/radio', (req, res) => {
    res.json({
        success: true,
        tracks: [
            { id: 'dQw4w9WgXcQ', name: 'Never Gonna Give You Up', artist: 'Rick Astley', image: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg' }
        ]
    });
});

app.get('/api/tophits', (req, res) => {
    res.json({
        success: true,
        tracks: [
            { id: 'fJ9rUzIMcZQ', name: 'Bohemian Rhapsody', artist: 'Queen', image: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg' }
        ]
    });
});

// GESTIONE INDEX.HTML PER SPA
app.get('*', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('File index.html non trovato nella cartella public.');
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`DarkSound Pro attivo sulla porta ${PORT}`);
});
