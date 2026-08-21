const express = require('express');
const path = require('path');
const yts = require('yt-search');
const youtubedl = require('youtube-dl-exec');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        const searchResult = await yts(query);
        const videos = searchResult.videos.slice(0, 20);

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

app.get('/api/stream/:id', async (req, res) => {
    const videoId = req.params.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        const output = await youtubedl(videoUrl, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            format: 'bestaudio/best',
            extractorArgs: 'youtube:player_client=web'
        });

        let audioUrl = null;
        if (output.formats) {
            const audioFormat = output.formats.reverse().find(f => f.acodec !== 'none' && f.vcodec === 'none');
            if (audioFormat) {
                audioUrl = audioFormat.url;
            } else if (output.url) {
                audioUrl = output.url;
            }
        }

        if (audioUrl) {
            return res.redirect(audioUrl);
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
