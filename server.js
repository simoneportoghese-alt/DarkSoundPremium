const express = require('express');
const path = require('path');
const yts = require('yt-search');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cache per le ricerche
const searchCache = new Map();

// API per la ricerca di video YouTube
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);
    
    // Controlla cache
    const cacheKey = query.toLowerCase();
    if (searchCache.has(cacheKey)) {
        const cached = searchCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 3600000) {
            console.log(`Cache hit per: "${query}"`);
            return res.json(cached.results);
        } else {
            searchCache.delete(cacheKey);
        }
    }
    
    try {
        console.log(`Ricerca YouTube per: "${query}"`);
        const searchResult = await yts(query);
        
        const results = searchResult.videos.slice(0, 20).map((item, index) => {
            // Pulisce il titolo
            let cleanTitle = item.title
                .replace(/\(.*?\)/g, '')
                .replace(/\[.*?\]/g, '')
                .replace(/official video/gi, '')
                .replace(/lyrics/gi, '')
                .replace(/video ufficiale/gi, '')
                .replace(/audio/gi, '')
                .replace(/hd/gi, '')
                .replace(/hq/gi, '')
                .trim();
            
            // Pulisce il nome dell'artista
            let cleanArtist = item.author.name
                .replace(/ - Topic/g, '')
                .replace(/VEVO/gi, '')
                .trim();
            
            return {
                id: item.videoId,
                name: cleanTitle || item.title,
                artist: cleanArtist || 'Sconosciuto',
                image: item.thumbnail || `https://picsum.photos/seed/${item.videoId}/200`,
                duration: item.duration?.timestamp || item.duration?.toString() || '3:30',
                audioUrl: `/api/stream/${item.videoId}`,
                url: item.url,
                index: index + 1
            };
        });
        
        // Salva in cache
        searchCache.set(cacheKey, {
            timestamp: Date.now(),
            results: results
        });
        
        console.log(`Trovati ${results.length} risultati`);
        res.json(results);
        
    } catch (error) {
        console.error('Errore ricerca:', error.message);
        res.json([]);
    }
});

// Endpoint per informazioni sul video (senza streaming diretto)
app.get('/api/video/:videoId', async (req, res) => {
    try {
        const videoId = req.params.videoId;
        const videoInfo = await yts({ videoId });
        
        if (videoInfo) {
            res.json({
                id: videoInfo.videoId,
                title: videoInfo.title,
                artist: videoInfo.author.name,
                thumbnail: videoInfo.thumbnail,
                url: videoInfo.url,
                duration: videoInfo.duration?.toString()
            });
        } else {
            res.status(404).json({ error: 'Video non trovato' });
        }
    } catch (error) {
        console.error('Errore info video:', error.message);
        res.status(500).json({ error: 'Errore recupero informazioni' });
    }
});

// Endpoint per lo streaming audio (opzionale - il client può usare l'URL diretto)
app.get('/api/stream/:videoId', async (req, res) => {
    try {
        const videoId = req.params.videoId;
        
        // Reindirizza alla pagina YouTube del video
        // Il client può gestire l'audio direttamente da YouTube
        res.redirect(`https://www.youtube.com/watch?v=${videoId}`);
        
    } catch (error) {
        console.error('Errore streaming:', error.message);
        res.status(500).json({ error: 'Errore streaming' });
    }
});

// Endpoint per pulire la cache
app.post('/api/clear-cache', (req, res) => {
    const cacheSize = searchCache.size;
    searchCache.clear();
    console.log(`Cache pulita: ${cacheSize} elementi rimossi`);
    res.json({ success: true, message: `Cache pulita: ${cacheSize} elementi rimossi` });
});

// Health check per Railway
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: Date.now(),
        cacheSize: searchCache.size,
        uptime: process.uptime()
    });
});

// Gestione errori
app.use((err, req, res, next) => {
    console.error('Errore server:', err.message);
    res.status(500).json({ error: 'Errore interno del server' });
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`🎵 Server DarkSound attivo su http://localhost:${PORT}`);
    console.log(`📡 API disponibili:`);
    console.log(`   - GET /api/search?q={query} - Ricerca video`);
    console.log(`   - GET /api/video/{videoId} - Info video`);
    console.log(`   - POST /api/clear-cache - Pulisci cache`);
    console.log(`   - GET /api/health - Stato server`);
});

// Gestione errori non catturati per evitare crash
process.on('unhandledRejection', (error) => {
    console.error('Errore non gestito (Promise):', error.message);
});

process.on('uncaughtException', (error) => {
    console.error('Eccezione non catturata:', error.message);
    // Non terminare il processo per errori minori
});
