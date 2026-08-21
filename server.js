const express = require('express');
const path = require('path');
const yts = require('yt-search');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ricerca YouTube reale, velocissima e senza crash su Render
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        const r = await yts(query);
        const videos = r.videos.slice(0, 15); // Prende i primi 15 risultati reali

        const results = videos.map(item => ({
            id: item.videoId,
            name: item.title,
            artist_name: item.author.name,
            image: item.thumbnail,
            duration: item.duration.seconds
        }));

        res.json(results);
    } catch (error) {
        console.error("Errore di ricerca:", error);
        res.json([]);
    }
});

// Streaming audio di test stabile (evita il blocco diretto di YouTube sul cloud)
app.get('/api/stream/:id', (req, res) => {
    // Reindirizzamento a un flusso audio di pubblico dominio perfettamente compatibile con il player
    const safeAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    res.redirect(safeAudioUrl);
});

app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});
