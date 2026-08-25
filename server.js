const express = require('express');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ ID UNIVOCO ============
const INSTANCE_ID = Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6);

console.log(`[${INSTANCE_ID}] 🚀 Avvio server...`);

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());

// ============ PUBLIC PATH ============
const publicPath = path.join(__dirname, 'public');
if (!fs.existsSync(publicPath)) {
    console.log(`[${INSTANCE_ID}] 📁 Creazione cartella public...`);
    fs.mkdirSync(publicPath, { recursive: true });
}

app.use(express.static(publicPath));

// ============ CACHE ============
const searchCache = new Map();

// ============ ROTTE SAFARI ============
app.get('/apple-touch-icon.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="180" height="180" fill="#1db954"/><text x="90" y="120" font-size="80" text-anchor="middle" fill="white">🎵</text></svg>`;
    res.send(Buffer.from(svg));
});

app.get('/manifest.json', (req, res) => {
    const manifestPath = path.join(publicPath, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
        res.sendFile(manifestPath);
    } else {
        res.json({
            name: "DarkSound Pro",
            short_name: "DarkSound",
            display: "standalone",
            background_color: "#000000",
            theme_color: "#30d158"
        });
    }
});

// ============ HOME ============
app.get('/', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send(`<h1>🎵 DarkSound Pro</h1><p>Server attivo! Instance: ${INSTANCE_ID}</p>`);
    }
});

// ============ API SEARCH ============
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Query mancante' });
    }
    
    const cacheKey = query.toLowerCase();
    if (searchCache.has(cacheKey)) {
        const cached = searchCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 3600000) {
            return res.json(cached.results);
        }
    }
    
    try {
        const searchResults = await ytsr(query, { limit: 20 });
        const tracks = searchResults.items
            .filter(item => item.type === 'video')
            .map(item => ({
                id: item.id,
                name: item.title || 'Titolo sconosciuto',
                artist: item.author?.name || 'Sconosciuto',
                image: item.bestThumbnail?.url || `https://picsum.photos/seed/${item.id}/200`,
                duration: item.duration || '3:30'
            }));
        
        searchCache.set(cacheKey, {
            timestamp: Date.now(),
            results: tracks
        });
        
        res.json(tracks);
    } catch (error) {
        console.error(`[${INSTANCE_ID}] ❌ Errore ricerca:`, error.message);
        res.status(500).json({ error: 'Errore nella ricerca', message: error.message });
    }
});

// ============ FALLBACK ============
app.use((req, res) => {
    res.status(404).json({ error: 'Rotta non trovata' });
});

// ============ AVVIO SERVER ============
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[${INSTANCE_ID}] ✅ Server in esecuzione su http://0.0.0.0:${PORT}`);
});

// ============ CHIUSURA ============
process.on('SIGTERM', () => {
    console.log(`[${INSTANCE_ID}] 🛑 Chiusura...`);
    server.close(() => process.exit(0));
});
