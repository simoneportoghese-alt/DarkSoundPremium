const express = require('express');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ ID UNIVOCO PER IL CONTAINER ============
const INSTANCE_ID = Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6);

// ============ GESTIONE ERRORI GLOBALI ============
process.on('uncaughtException', (err) => {
    console.error(`[${INSTANCE_ID}] ❌ Uncaught Exception:`, err.message);
});

process.on('unhandledRejection', (err) => {
    console.error(`[${INSTANCE_ID}] ❌ Unhandled Rejection:`, err.message);
});

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());

// ============ VERIFICA CARTELLA PUBLIC ============
const publicPath = path.join(__dirname, 'public');
if (!fs.existsSync(publicPath)) {
    console.error(`[${INSTANCE_ID}] ❌ Cartella "public" non trovata! Creazione...`);
    fs.mkdirSync(publicPath, { recursive: true });
    console.log(`[${INSTANCE_ID}] ✅ Cartella "public" creata`);
}

// ============ SERVI FILE STATICI ============
app.use(express.static(publicPath));

// ============ CACHE RICERCHE ============
const searchCache = new Map();

// ============ ROTTA HEALTH CHECK (PRIMA DI TUTTO) ============
app.get('/health', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json({ 
        status: 'ok', 
        instance: INSTANCE_ID,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// ============ ROTTE PER SAFARI ============
app.get('/apple-touch-icon.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    // SVG come fallback
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="180" height="180" fill="#1db954"/><text x="90" y="120" font-size="80" text-anchor="middle" fill="white">🎵</text></svg>`;
    res.send(Buffer.from(svg));
});

app.get('/apple-touch-icon-precomposed.png', (req, res) => {
    res.redirect('/apple-touch-icon.png');
});

// ============ ROTTA PER IL MANIFEST ============
app.get('/manifest.json', (req, res) => {
    const manifestPath = path.join(publicPath, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
        res.sendFile(manifestPath);
    } else {
        res.status(200).json({
            name: "DarkSound Pro",
            short_name: "DarkSound",
            description: "DarkSound Pro - Ultimate Edition",
            start_url: "/",
            display: "standalone",
            background_color: "#000000",
            theme_color: "#30d158",
            icons: [
                { src: "https://picsum.photos/192", sizes: "192x192", type: "image/png" },
                { src: "https://picsum.photos/512", sizes: "512x512", type: "image/png" }
            ]
        });
    }
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
            <head>
                <title>DarkSound Pro</title>
                <link rel="manifest" href="/manifest.json">
                <link rel="apple-touch-icon" href="/apple-touch-icon.png">
            </head>
            <body style="font-family:sans-serif;text-align:center;padding:50px;background:#121212;color:#fff;">
                <h1>🎵 DarkSound Pro</h1>
                <p>Server in esecuzione! 🚀</p>
                <p style="color:#1db954;">✅ Container attivo</p>
                <p style="color:#666;font-size:12px;">Instance: ${INSTANCE_ID}</p>
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
        console.error(`[${INSTANCE_ID}] ❌ Errore ricerca:`, error.message);
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
    console.log(`[${INSTANCE_ID}] ✅ Server DarkSound in esecuzione su http://0.0.0.0:${PORT}`);
    console.log(`[${INSTANCE_ID}] 🆔 Instance ID: ${INSTANCE_ID}`);
});

// ============ KEEP-ALIVE PER RAILWAY ============
setInterval(() => {
    console.log(`[${INSTANCE_ID}] 💓 Keep-alive ping: ${new Date().toISOString()} | Uptime: ${Math.floor(process.uptime())}s`);
}, 10000);

// ============ GESTIONE CHIUSURA GENTILE ============
const gracefulShutdown = () => {
    console.log(`[${INSTANCE_ID}] 🛑 Ricevuto segnale di chiusura, chiusura server...`);
    server.close(() => {
        console.log(`[${INSTANCE_ID}] ✅ Server chiuso correttamente`);
        process.exit(0);
    });
    
    setTimeout(() => {
        console.error(`[${INSTANCE_ID}] ❌ Chiusura forzata dopo timeout`);
        process.exit(1);
    }, 3000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
