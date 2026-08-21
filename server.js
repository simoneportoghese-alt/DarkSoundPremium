const express = require('express');
const path = require('path');
const youtubedl = require('youtube-dl-exec');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        // Usiamo un formato di ricerca più robusto simulando un client web standard
        const output = await youtubedl(`ytsearch15:${query}`, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            // Cambiamo client per evitare il blocco bot
            extractorArgs: 'youtube:player_client=web'
        });

        let entries = output.entries || [output];
        const results = entries.map(item => ({
            id: item.id,
            name: item.title || "Brano sconosciuto",
            artist_name: item.uploader || "Artista",
            image: item.thumbnail || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300",
            duration: item.duration || 0
        }));

        res.json(results);
    } catch (error) {
        console.error("Errore di ricerca YouTube:", error.message);
        res.status(500).json({ error: "Errore durante la ricerca" });
    }
});

app.get('/api/stream/:id', async (req, res) => {
    const videoId = req.params.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        const info = await youtubedl(videoUrl, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            extractorArgs: 'youtube:player_client=web'
        });

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
