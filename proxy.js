const express = require('express');
const fetch = require('node-fetch'); // Assicurati di averlo installato: npm install node-fetch
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static('public'));

// Endpoint proxy per la ricerca
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Parametro q mancante' });
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyB7NTILkaZE7RDC5YBWyJw9N6q5ASGIhlk';
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=15&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data); // Invia i dati al frontend
    } catch (error) {
        console.error('Errore proxy:', error);
        res.status(500).json({ error: 'Errore durante la ricerca' });
    }
});

app.listen(PORT, () => console.log(`✅ Proxy server running on port ${PORT}`));
