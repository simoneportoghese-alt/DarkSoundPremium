const express = require('express');
const path = require('path');
const { YtDlp } = require('@abdullah2993/ytdlp-nodejs');

const app = express();
const ytdlp = new YtDlp();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API di ricerca brani
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        const searchUrl = `ytsearch10:${query} audio`;
        const info = await ytdlp.getInfoAsync(searchUrl);
        
        let entries = info.entries || [info];
        const results = entries.map(item => ({
            id: item.id,
            name: item.title || "Brano sconosciuto",
            artist_name: item.uploader || "Artista",
            image: item.thumbnail || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150",
            duration: item.duration || 0
        }));

        res.json(results);
    } catch (error) {
        console.error("Errore di ricerca:", error);
        res.status(500).json({ error: "Errore durante la ricerca dei brani" });
    }
});

// API per lo streaming audio
app.get('/api/stream/:id', async (req, res) => {
    const videoId = req.params.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        const info = await ytdlp.getInfoAsync(videoUrl);
        const audioFormat = info.formats.find(f => f.acodec !== 'none' && f.vcodec === 'none') || info.formats[0];
        
        if (audioFormat && audioFormat.url) {
            return res.redirect(audioFormat.url);
        } else {
            res.status(404).json({ error: "Flusso audio non trovato" });
        }
    } catch (error) {
        console.error("Errore streaming:", error);
        res.status(500).json({ error: "Impossibile riprodurre il brano" });
    }
});

app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});
