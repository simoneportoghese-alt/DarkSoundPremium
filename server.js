const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serviamo i file statici (index.html, css, js) dalla cartella corrente o 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// --- ENDPOINT API ---

// 1. Dati per "La tua Radio Personale"
app.get('/api/radio', (req, res) => {
    res.json({
        success: true,
        tracks: [
            {
                id: 'dQw4w9WgXcQ',
                name: 'Never Gonna Give You Up',
                artist: 'Rick Astley',
                image: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
            },
            {
                id: 'L_jWHffIx5E',
                name: 'Smells Like Teen Spirit',
                artist: 'Nirvana',
                image: 'https://img.youtube.com/vi/L_jWHffIx5E/hqdefault.jpg'
            }
        ]
    });
});

// 2. Dati per "Top Hit Nazionali"
app.get('/api/tophits', (req, res) => {
    res.json({
        success: true,
        tracks: [
            {
                id: 'fJ9rUzIMcZQ',
                name: 'Bohemian Rhapsody',
                artist: 'Queen',
                image: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg'
            },
            {
                id: 'JGwWNGJdvx8',
                name: 'Shape of You',
                artist: 'Ed Sheeran',
                image: 'https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg'
            },
            {
                id: '09R8_2nJtjg',
                name: 'Sugar',
                artist: 'Maroon 5',
                image: 'https://img.youtube.com/vi/09R8_2nJtjg/hqdefault.jpg'
            }
        ]
    });
});

// Fallback per Single Page Application: reindirizza tutte le altre rotte su index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Configurazione porta FONDAMENTALE per Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server DarkSound Pro attivo e in ascolto sulla porta ${PORT}`);
});
