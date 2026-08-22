const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Cartella file statici (PWA / Frontend)
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.use(express.static(__dirname));

// --- ROTTE PWA ---
app.get('/sw.js', (req, res) => {
    res.sendFile(path.join(publicPath, 'sw.js'));
});

app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(publicPath, 'manifest.json'));
});

// --- API ENDPOINTS ---

// 1. Radio Personale
app.get('/api/radio', (req, res) => {
    res.json({
        success: true,
        tracks: [
            { id: 'dQw4w9WgXcQ', name: 'Never Gonna Give You Up', artist: 'Rick Astley', image: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg' }
        ]
    });
});

// 2. Top Hits
app.get('/api/tophits', (req, res) => {
    res.json({
        success: true,
        tracks: [
            { id: 'fJ9rUzIMcZQ', name: 'Bohemian Rhapsody', artist: 'Queen', image: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg' },
            { id: 'JGwWNGJdvx8', name: 'Shape of You', artist: 'Ed Sheeran', image: 'https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg' }
        ]
    });
});

// 3. RICERCA BRANI (Risolve l'errore nella schermata Cerca)
app.get('/api/search', (req, res) => {
    const query = req.query.q || req.query.query || '';
    
    // Risultati di esempio/mock basati sulla ricerca
    res.json({
        success: true,
        results: [
            {
                id: 'dQw4w9WgXcQ',
                title: `${query} - Official Track 1`,
                artist: 'DarkSound Artist',
                image: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
            },
            {
                id: 'fJ9rUzIMcZQ',
                title: `${query} - Live Performance`,
                artist: 'DarkSound Band',
                image: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg'
            }
        ]
    });
});

// Fallback SPA
app.get('*', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('File index.html non trovato.');
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`DarkSound Pro attivo sulla porta ${PORT}`);
});
