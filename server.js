const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const yts = require('yt-search');

const app = express();

app.use(cors());
app.use(express.json());

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.use(express.static(__dirname));

// Rotte PWA
app.get('/sw.js', (req, res) => {
    res.sendFile(path.join(publicPath, 'sw.js'));
});

app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(publicPath, 'manifest.json'));
});

// Ricerca nativa su YouTube tramite il server
app.get(['/api/search', '/api/v1/search'], async (req, res) => {
    const query = req.query.q || req.query.query || '';
    if (!query) {
        return res.json({ success: true, results: [] });
    }

    try {
        const r = await yts(query);
        const videos = r.videos.slice(0, 15);

        const results = videos.map(v => ({
            id: v.videoId,
            title: v.title,
            artist: v.author.name,
            image: v.thumbnail || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`
        }));

        res.json({ success: true, results });
    } catch (err) {
        console.error('Errore ricerca YouTube:', err);
        res.status(500).json({ success: false, error: 'Errore durante la ricerca' });
    }
});

app.get('*', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Index file not found');
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`DarkSound Pro attivo sulla porta ${PORT}`);
});
