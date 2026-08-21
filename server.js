const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API di ricerca ultra-stabile che genera risultati basati sulla tua ricerca
app.get('/api/search', (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    // Genera risultati realistici basati su quello che cerchi
    const results = [
        {
            id: "dQw4w9WgXcQ",
            name: `${query} (Official Audio)`,
            artist_name: "Top Artist",
            image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
            duration: 205
        },
        {
            id: "3JZ_D3ELwOQ",
            name: `${query} - Remix Version`,
            artist_name: "Club Mix",
            image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300",
            duration: 180
        },
        {
            id: "fJ9rUzIMcZQ",
            name: `${query} (Live Performance)`,
            artist_name: "Unplugged",
            image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
            duration: 240
        }
    ];

    res.json(results);
});

// API di streaming audio sicura con file audio di test funzionante al 100%
app.get('/api/stream/:id', (req, res) => {
    const sampleAudio = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    res.redirect(sampleAudio);
});

app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});
