const express = require('express');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Cache per le ricerche
const searchCache = new Map();
const streamCache = new Map();

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
        
        searchCache.set(cacheKey, {
            timestamp: Date.now(),
            results: tracks
        });
        
        res.json(tracks);
    } catch (error) {
        console.error('Errore ricerca:', error);
        res.json([]);
    }
});

// Endpoint per lo streaming audio
app.get('/api/stream/:videoId', async (req, res) => {
    const videoId = req.params.videoId;
    
    try {
        // Verifica cache
        if (streamCache.has(videoId)) {
            const cached = streamCache.get(videoId);
            if (Date.now() - cached.timestamp < 3600000) {
                res.setHeader('Content-Type', 'audio/mpeg');
                res.setHeader('Accept-Ranges', 'bytes');
                res.setHeader('Cache-Control', 'public, max-age=3600');
                return res.send(cached.buffer);
            }
        }
        
        const info = await ytdl.getInfo(videoId);
        const audioFormat = ytdl.chooseFormat(info.formats, { 
            quality: 'highestaudio',
            filter: 'audioonly'
        });
        
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        // Stream audio
        const stream = ytdl(videoId, { 
            format: audioFormat,
            quality: 'highestaudio'
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

// Endpoint per ottenere info audio
app.get('/api/audio-info/:videoId', async (req, res) => {
    try {
        const info = await ytdl.getInfo(req.params.videoId);
        const audioFormat = ytdl.chooseFormat(info.formats, { 
            quality: 'highestaudio',
            filter: 'audioonly'
        });
        
        res.json({
            title: info.videoDetails.title,
            author: info.videoDetails.author.name,
            thumbnail: info.videoDetails.thumbnails[0]?.url,
            audioUrl: audioFormat.url,
            duration: info.videoDetails.lengthSeconds
        });
    } catch (error) {
        res.status(404).json({ error: 'Video non trovato' });
    }
});

app.listen(PORT, () => {
    console.log(`Server DarkSound in esecuzione su http://localhost:${PORT}`);
});
