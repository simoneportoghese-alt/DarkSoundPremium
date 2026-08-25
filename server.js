const express = require('express');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ GESTIONE ERRORI GLOBALI ============
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
});

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());

// ============ VERIFICA CARTELLA PUBLIC ============
const publicPath = path.join(__dirname, 'public');
if (!fs.existsSync(publicPath)) {
    console.error('❌ Cartella "public" non trovata! Creazione...');
    fs.mkdirSync(publicPath, { recursive: true });
    console.log('✅ Cartella "public" creata');
}

// ============ SERVI FILE STATICI ============
app.use(express.static(publicPath));

// ============ CACHE RICERCHE ============
const searchCache = new Map();

// ============ ROTTA HEALTH CHECK (PRIMA DI TUTTO) ============
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// ============ ROTTA PRINCIPALE ============
app.get('/', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head><title>DarkSound Pro</title></head>
            <body style="font-family:sans-serif;text-align:center;padding:50px;background:#121212;color:#fff;">
                <h1>🎵 DarkSound Pro</h1>
                <p>Server in esecuzione! 🚀</p>
                <p style="color:#1db954;">✅ Container attivo</p>
                <p style="color:#666;font-size:12px;">Uptime: ${Math.floor(process.uptime())}s</p>
            </body>
            </html>
        `);
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
        console.error('❌ Errore ricerca:', error.message);
        res.status(500).json({ 
            error: 'Errore nella ricerca', 
            message: error.message 
        });
    }
});

// ============ ROTTA FALLBACK ============
app.use((req, res) => {
    res.status(404).json({ error: 'Rotta non trovata' });
});

// ============ AVVIO SERVER ============
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server DarkSound in esecuzione su http://0.0.0.0:${PORT}`);
    console.log(`🕐 Avviato il: ${new Date().toISOString()}`);
    console.log(`📁 Directory: ${__dirname}`);
    console.log(`📄 Public path: ${publicPath}`);
    console.log(`🔍 Health check disponibile su /health`);
});

// ============ KEEP-ALIVE PER RAILWAY ============
// Ping ogni 25 secondi per mantenere il container attivo
setInterval(() => {
    console.log(`💓 Keep-alive ping: ${new Date().toISOString()} | Uptime: ${Math.floor(process.uptime())}s`);
}, 25000);

// ============ GESTIONE CHIUSURA GENTILE ============
const gracefulShutdown = () => {
    console.log('🛑 Ricevuto segnale di chiusura, chiusura server...');
    server.close(() => {
        console.log('✅ Server chiuso correttamente');
        process.exit(0);
    });
    
    setTimeout(() => {
        console.error('❌ Chiusura forzata dopo timeout');
        process.exit(1);
    }, 3000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
