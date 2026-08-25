const express = require('express');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const INSTANCE_ID = Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6);

console.log(`[${INSTANCE_ID}] 🚀 Avvio server...`);

app.use(cors());
app.use(express.json());

const publicPath = path.join(__dirname, 'public');
if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
}
app.use(express.static(publicPath));

const searchCache = new Map();

// ============ ROTTA HEALTH CHECK (RISPOSTA IMMEDIATA) ============
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', instance: INSTANCE_ID, uptime: Math.floor(process.uptime()) });
});

// ============ ROTTA PRINCIPALE ============
app.get('/', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send(`<h1>🎵 DarkSound Pro</h1><p>Server attivo! Instance: ${INSTANCE_ID}</p>`);
    }
});

// ============ ROTTA RICERCA ============
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

// ============ AVVIO SERVER ============
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[${INSTANCE_ID}] ✅ Server in esecuzione su http://0.0.0.0:${PORT}`);
});

// ============ GESTIONE CHIUSURA ============
process.on('SIGTERM', () => {
    console.log(`[${INSTANCE_ID}] 🛑 Chiusura...`);
    server.close(() => process.exit(0));
});
