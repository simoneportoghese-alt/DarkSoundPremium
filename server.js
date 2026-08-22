const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cache semplice
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

function getFromCache(key) {
    if (cache.has(key)) {
        const cached = cache.get(key);
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        cache.delete(key);
    }
    return null;
}

function setToCache(key, data) {
    cache.set(key, {
        timestamp: Date.now(),
        data: data
    });
}

// API per la ricerca
app.get('/api/search', async (req, res) => {
    const query = req.query.q || '';
    const cacheKey = `search_${query}`;
    
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
        return res.json(cachedResult);
    }
    
    try {
        const tracks = await generateMockTracks(query);
        setToCache(cacheKey, tracks);
        res.json(tracks);
    } catch (error) {
        console.error('Errore nella ricerca:', error);
        res.status(500).json({ error: 'Errore nella ricerca' });
    }
});

// Genera brani simulati
async function generateMockTracks(query) {
    const genres = ['Pop', 'Rock', 'Electronic', 'Hip Hop', 'Jazz', 'Classical'];
    const artists = [
        'Sfera Ebbasta', 'Club Dogo', 'Annalisa', 'Twenty One Pilots', 
        'Travis Scott', 'Dua Lipa', 'Coldplay', 'Imagine Dragons',
        'Marracash', 'Lazza', 'Geolier', 'Blanco'
    ];
    
    const tracks = [];
    const trackCount = 15;
    
    for (let i = 0; i < trackCount; i++) {
        const genre = genres[Math.floor(Math.random() * genres.length)];
        const artist = artists[Math.floor(Math.random() * artists.length)];
        
        tracks.push({
            id: `track_${Date.now()}_${i}`,
            name: `${query} - ${genre} Hit ${i + 1}`,
            artist: artist,
            image: `https://picsum.photos/seed/music${Date.now()}_${i}/400`,
            duration: Math.floor(Math.random() * 240) + 120,
            genre: genre,
            plays: Math.floor(Math.random() * 1000000),
            year: 2023 + Math.floor(Math.random() * 3)
        });
    }
    
    return tracks;
}

// API per le statistiche
app.get('/api/stats', (req, res) => {
    res.json({
        totalTracks: 1000,
        activeUsers: 50,
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

// Health check per Railway
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Servi il file HTML principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gestione errori 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint non trovato' });
});

// Gestione errori generali
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Errore interno del server' });
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`🚀 DarkSound Pro server in esecuzione sulla porta ${PORT}`);
    console.log(`📱 Visita http://localhost:${PORT}`);
});
