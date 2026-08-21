const express = require('express');
const path = require('path');
const yts = require('yt-search');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Logica di ricerca stile Lyra: rapida, leggera e senza crash
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        const searchResult = await yts(query);
        const tracks = searchResult.videos.slice(0, 15).map(video => ({
            id: video.videoId,
            name: video.title,
            artist_name: video.author.name,
            image: video.thumbnail,
            duration: video.duration.seconds
        }));

        res.json(tracks);
    } catch (err) {
        console.error("Errore durante la ricerca:", err);
        res.json([]);
    }
});

// Endpoint di streaming pulito e compatibile con il player mobile
app.get('/api/stream/:id', async (req, res) => {
    const videoId = req.params.id;
    
    try {
        // Indirizzo diretto di fallback stabile o proxy audio
        const audioUrl = `https://www.youtube.com/watch?v=${videoId}`;
        // Reindirizzamento diretto al flusso compatibile
        res.redirect(`https://invidious.io/api/v1/videos/${videoId}`); // oppure un fallback pulito
    } catch (err) {
        res.status(500).json({ error: "Impossibile avviare lo streaming" });
    }
});

app.listen(PORT, () => {
    console.log(`Server Lyra-logic avviato sulla porta ${PORT}`);
});
