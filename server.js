const express = require('express');
const path = require('path');
const ytdlp = require('yt-dlp-exec');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API di ricerca brani
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        const output = await ytdlp(`ytsearch10:${query} audio`, {
            dumpJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:https://www.youtube.com']
        });

        // yt-dlp-exec restituisce un singolo oggetto JSON o stringhe multiple per riga
        const lines = output.trim().split('\n');
        const results = lines.map(line => {
            try {
                const item = JSON.parse(line);
                return {
                    id: item.id,
                    name: item.title || "Brano sconosciuto",
                    artist_name: item.uploader || "Artista",
                    image: item.thumbnail || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150",
                    duration: item.duration || 0
                };
            } catch (e) {
                return null;
            }
        }).filter(item => item !== null);

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
        const output = await ytdlp(videoUrl, {
            dumpJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true
        });

        const info = JSON.parse(output.trim());
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

