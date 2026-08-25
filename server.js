const express = require('express');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ============ GESTIONE ERRORI GLOBALI ============
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ CACHE ============
const searchCache = new Map();

// ============ ROTTA RICERCA ============
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);
    
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
        console.error('❌ Errore ricerca:', error.message);
        res.status(500).json({ error: 'Errore nella ricerca', message: error.message });
    }
});

// ============ ROTTA STATO / HEALTH CHECK ============
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// ============ ROTTA PRINCIPALE ============
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ AVVIO SERVER ============
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server DarkSound in esecuzione su http://0.0.0.0:${PORT}`);
    console.log(`🕐 Avviato il: ${new Date().toISOString()}`);
    console.log(`📁 Directory: ${__dirname}`);
});

// ============ KEEP-ALIVE PER RAILWAY ============
// Invia un ping ogni 60 secondi per mantenere il container attivo
setInterval(() => {
    console.log(`💓 Keep-alive ping: ${new Date().toISOString()} | Uptime: ${Math.floor(process.uptime())}s`);
}, 60000);

// ============ GESTIONE CHIUSURA ============
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM ricevuto, chiusura server...');
    server.close(() => {
        console.log('✅ Server chiuso correttamente');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT ricevuto, chiusura server...');
    server.close(() => {
        console.log('✅ Server chiuso correttamente');
        process.exit(0);
    });
});
