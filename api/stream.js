import ytsr from 'ytsr';
import ytdl from '@distube/ytdl-core';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query mancante' });
  }

  try {
    const searchResults = await ytsr(q, { limit: 5 });
    const video = searchResults.items.find(item => item.type === 'video');

    if (!video) {
      return res.status(404).json({ error: 'Nessun video trovato' });
    }

    const info = await ytdl.getInfo(video.url);
    const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });

    if (!format || !format.url) {
      return res.status(500).json({ error: 'Formato audio non disponibile' });
    }

    return res.status(200).json({
      title: video.title,
      artist: video.author ? video.author.name : 'Artista Sconosciuto',
      artwork: video.bestThumbnail?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&h=500&fit=crop',
      audioUrl: format.url
    });

  } catch (err) {
    console.error('Errore streaming:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}
