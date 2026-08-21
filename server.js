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
        const videos = searchResult.videos.slice(0, 25);

        const results = videos.map(item => {
            let cleanTitle = item.title
                .replace(/\(.*?\)/g, '')
                .replace(/\[.*?\]/g, '')
                .replace(/official video/gi, '')
                .replace(/lyrics/gi, '')
                .replace(/video ufficiale/gi, '')
                .trim();

            let artist = item.author.name.replace(/ - Topic/g, '').trim();

            return {
                id: item.videoId,
                name: cleanTitle || item.title,
                artist_name: artist,
                image: item.thumbnail,
                duration: item.duration.seconds
            };
        });

        const uniqueResults = results.filter((v, i, self) => 
            i === self.findIndex(t => t.id === v.id || t.name.toLowerCase() === v.name.toLowerCase())
        );

        res.json(uniqueResults.slice(0, 15));
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
            format: 'bestaudio',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        });

        let audioUrl = null;
        if (output.url) {
            audioUrl = output.url;
        } else if (output.formats) {
            const audioFormat = output.formats.reverse().find(f => f.acodec !== 'none');
            if (audioFormat) audioUrl = audioFormat.url;
        }
        
        if (audioUrl) {
            res.json({ streamUrl: audioUrl });
        } else {
            res.status(404).json({ error: "Nessun flusso disponibile" });
        }
    } catch (error) {
        console.error("Errore streaming:", error.message);
        res.status(500).json({ error: "Errore nel recupero stream" });
    }
});

app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});
