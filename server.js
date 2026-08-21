const express = require('express');
const path = require('path');
const yts = require('yt-search');
const youtubedl = require('youtube-dl-exec');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ricerca istantanea con yt-search
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        const searchResult = await yts(query);
        const videos = searchResult.videos.slice(0, 15);

        const results = videos.map(item => ({
            id: item.videoId,
            name: item.title,
            artist_name: item.author.name,
            image: item.thumbnail,
            duration: item.duration.seconds
        }));

        res.json(results);
    } catch (error) {
        console.error("Errore ricerca:", error);
        res.json([]);
    }
});

// Streaming del brano completo
app.get('/api/stream/:id', async (req, res) => {
    const videoId = req.params.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        const output = await youtubedl(videoUrl, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            extractorArgs: 'youtube:player_client=web'
        });

        const audioFormat = output.formats.find(f => f.acodec !== 'none' && f.vcodec === 'none') || output.formats[0];
        
        if (audioFormat && audioFormat.url) {
            return res.redirect(audioFormat.url);
        } else {
            res.status(404).json({ error: "Flusso audio non trovato" });
        }
    } catch (error) {
        console.error("Errore streaming:", error.message);
        res.status(500).json({ error: "Impossibile riprodurre il brano" });
    }
});

app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});
