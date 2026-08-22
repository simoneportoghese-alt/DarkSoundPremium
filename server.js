const express = require('express');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const searchCache = new Map();

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
                name: item.title,
                artist: item.author?.name || 'Sconosciuto',
                image: item.bestThumbnail?.url || `https://picsum.photos/seed/${item.id}/200`,
                duration: item.duration || '3:30',
                audioUrl: `/api/stream/${item.id}`
            }));
        
        searchCache.set(cacheKey, { timestamp: Date.now(), results: tracks });
        res.json(tracks);
    } catch (error) {
        console.error('Errore ricerca:', error);
        res.json([]);
    }
});

app.get('/api/stream/:videoId', async (req, res) => {
    const videoId = req.params.videoId;
    
    try {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache');
        
        const stream = ytdl(videoId, {
            quality: 'highestaudio',
            filter: 'audioonly',
            highWaterMark: 1024 * 1024
        });
        
        stream.pipe(res);
        
        stream.on('error', (error) => {
            console.error('Errore streaming:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Errore streaming' });
            }
        });
    } catch (error) {
        console.error('Errore streaming:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Errore streaming' });
        }
    }
});

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server DarkSound in esecuzione su http://localhost:${PORT}`);
});
