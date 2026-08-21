import ytsr from 'ytsr';
import ytdl from '@distube/ytdl-core';

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Parametro di ricerca mancante' });
  }

  try {
    // 1. Cerca il brano su YouTube
    const searchResults = await ytsr(q, { limit: 1 });
    const video = searchResults.items.find(item => item.type === 'video');

    if (!video) {
      return res.status(404).json({ error: 'Nessun brano trovato' });
    }

    // 2. Estrai il link audio diretto
    const info = await ytdl.getInfo(video.url);
    const audioFormat = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });

    if (!audioFormat || !audioFormat.url) {
      return res.status(500).json({ error: 'Impossibile estrarre lo stream audio' });
    }

    // 3. Restituisci i dati al frontend
    return res.status(200).json({
      title: video.title,
      artist: video.author ? video.author.name : 'Unknown Artist',
      artwork: video.bestThumbnail?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&h=500&fit=crop',
      audioUrl: audioFormat.url
    });

  } catch (error) {
    console.error("Errore Backend:", error);
    return res.status(500).json({ error: 'Errore durante la ricerca del brano' });
  }
}
