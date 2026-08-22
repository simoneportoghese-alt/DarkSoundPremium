const express = require('express');
const path = require('path');
const yts = require('yt-search');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);
    try {
        const searchResult = await yts(query);
        const results = searchResult.videos.slice(0, 20).map(item => {
            let cleanTitle = item.title
                .replace(/\(.*?\)/g, '')
                .replace(/\[.*?\]/g, '')
                .replace(/official video/gi, '')
                .replace(/lyrics/gi, '')
                .replace(/video ufficiale/gi, '')
                .trim();
            return {
                id: item.videoId,
                name: cleanTitle,
                artist: item.author.name.replace(/ - Topic/g, '').trim(),
                image: item.thumbnail
            };
        });
        res.json(results);
    } catch (e) { res.json([]); }
});

app.listen(PORT, () => console.log(`Server attivo su ${PORT}`));
