const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API di ricerca simulata e stabile (evita qualsiasi crash del server su Render)
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    // Restituisce risultati dimostrativi perfetti per testare la grafica e la UI
    const dummyResults = [
        {
            id: "dQw4w9WgXcQ",
            name: `${query} - Official Track`,
            artist_name: "DarkSound Artist",
            image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300",
            duration: 210
        },
        {
            id: "3JZ_D3ELwOQ",
            name: `${query} (Remix Edition)`,
            artist_name: "Global Beats",
            image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
            duration: 185
        },
        {
            id: "fJ9rUzIMcZQ",
            name: `${query} (Acoustic Version)`,
            artist_name: "Live Studio",
            image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300",
            duration: 240
        }
    ];

    res.json(dummyResults);
});

// API per lo streaming (reindirizzamento diretto a tracce audio di pubblico dominio/test)
app.get('/api/stream/:id', (req, res) => {
    // Audio di test funzionante al 100% per verificare il player mobile
    const sampleAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    res.redirect(sampleAudioUrl);
});

app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});
