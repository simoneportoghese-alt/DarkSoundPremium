const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

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

// Endpoint API Ricerca (gestisce sia /api/search che /api/v1/search)
app.get(['/api/search', '/api/v1/search'], (req, res) => {
    const query = req.query.q || req.query.query || 'Dark';
    
    res.json({
        success: true,
        results: [
            {
                id: 'dQw4w9WgXcQ',
                title: `${query} - Track Official`,
                artist: 'DarkSound Artist',
                image: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
            },
            {
                id: 'fJ9rUzIMcZQ',
                title: `${query} - Remix Edition`,
                artist: 'DarkSound Studio',
                image: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg'
            },
            {
                id: 'L_LUpnjgPso',
                title: `${query} - Live Performance`,
                artist: 'DarkSound Live',
                image: 'https://img.youtube.com/vi/L_LUpnjgPso/hqdefault.jpg'
            }
        ]
    });
});

app.get('/api/radio', (req, res) => {
    res.json({
        success: true,
        tracks: [
            { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', image: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg' }
        ]
    });
});

// Serve index.html
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
