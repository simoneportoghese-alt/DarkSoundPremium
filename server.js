const express = require('express');
const path = require('path');
const yts = require('yt-search');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware base
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Cache semplice in memoria
const searchCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minuti

// API per la ricerca
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        
        if (!query) {
            return res.json([]);
        }
        
        // Controlla cache
        const cacheKey = query.toLowerCase().trim();
        if (searchCache.has(cacheKey)) {
            const cached = searchCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                return res.json(cached.results);
            }
        }
        
        console.log(`Ricerca: "${query}"`);
        
        // Esegue la ricerca con timeout
        const searchResult = await Promise.race([
            yts(query),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout ricerca')), 10000)
            )
        ]);
        
        // Limita a 20 risultati
        const videos = searchResult.videos.slice(0, 20);
        
        const results = videos.map((item, index) => {
            // Pulisce il titolo in modo sicuro
            let cleanTitle = item.title || 'Senza titolo';
            try {
                cleanTitle = cleanTitle
                    .replace(/\(.*?\)/g, '')
                    .replace(/\[.*?\]/g, '')
                    .replace(/official video/gi, '')
                    .replace(/lyrics/gi, '')
                    .replace(/video ufficiale/gi, '')
                    .trim();
            } catch (e) {
                // Usa il titolo originale se c'è un errore
                cleanTitle = item.title || 'Senza titolo';
            }
            
            // Pulisce il nome dell'artista in modo sicuro
            let cleanArtist = 'Sconosciuto';
            try {
                if (item.author && item.author.name) {
                    cleanArtist = item.author.name
                        .replace(/ - Topic/g, '')
                        .trim();
                }
            } catch (e) {
                // Mantiene 'Sconosciuto' se c'è un errore
            }
            
            return {
                id: item.videoId || `video-${index}`,
                name: cleanTitle,
                artist: cleanArtist,
                image: item.thumbnail || `https://picsum.photos/seed/${item.videoId || index}/200`,
                duration: item.duration ? item.duration.toString() : '3:30',
                index: index + 1
            };
        });
        
        // Salva in cache
        if (results.length > 0) {
            searchCache.set(cacheKey, {
                timestamp: Date.now(),
                results: results
            });
            
            // Limita la dimensione della cache
            if (searchCache.size > 100) {
                const firstKey = searchCache.keys().next().value;
                searchCache.delete(firstKey);
            }
        }
        
        console.log(`Trovati ${results.length} risultati per "${query}"`);
        res.json(results);
        
    } catch (error) {
        console.error('Errore ricerca:', error.message || 'Errore sconosciuto');
        // Restituisce sempre un array vuoto in caso di errore
        res.json([]);
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        memory: process.memoryUsage().heapUsed / 1024 / 1024,
        cacheSize: searchCache.size
    });
});

// Endpoint root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gestione errori globale
app.use((err, req, res, next) => {
    console.error('Errore:', err.message);
    res.status(500).json({ error: 'Errore interno' });
});

// Avvia il server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server attivo su porta ${PORT}`);
});

// Gestione errori per evitare crash
server.on('error', (error) => {
    console.error('Errore server:', error.message);
});

// Timeout per le richieste
server.timeout = 15000; // 15 secondi
server.keepAliveTimeout = 5000;
server.headersTimeout = 6000;

// Non far crashare il processo per errori
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason?.message || 'Errore sconosciuto');
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error.message);
    // Non terminare il processo
});

// Log memory usage ogni 5 minuti
setInterval(() => {
    const used = process.memoryUsage();
    console.log(`📊 Memory: ${Math.round(used.heapUsed / 1024 / 1024)}MB / ${Math.round(used.heapTotal / 1024 / 1024)}MB`);
    
    // Pulisci cache se la memoria è alta
    if (used.heapUsed / 1024 / 1024 > 200) { // > 200MB
        console.log('🧹 Pulizia cache per memoria alta');
        searchCache.clear();
    }
}, 300000);
