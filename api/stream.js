export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query mancante' });

  try {
    // 1. Cerca il brano su SoundCloud tramite API pubblica
    const client_id = 'iZ864R3318m232X2481Z218321832183'; // Client ID pubblico
    const searchUrl = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(q)}&client_id=${client_id}&limit=1`;
    
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.collection || searchData.collection.length === 0) {
      return res.status(404).json({ error: 'Brano non trovato su SoundCloud' });
    }

    const track = searchData.collection[0];
    
    // 2. Trova il formato MP3/Progressive
    const progressiveFormat = track.media.transcodings.find(t => t.format.protocol === 'progressive');

    if (!progressiveFormat) {
      return res.status(404).json({ error: 'Stream audio non disponibile' });
    }

    // 3. Recupera l'URL diretto dello stream audio
    const streamUrlRes = await fetch(`${progressiveFormat.url}?client_id=${client_id}`);
    const streamUrlData = await streamUrlRes.json();

    if (streamUrlData.url) {
      // Restituisce sia l'URL dello stream che la copertina HD
      return res.status(200).json({
        audioUrl: streamUrlData.url,
        title: track.title,
        artist: track.user.username,
        artwork: track.artwork_url ? track.artwork_url.replace('-large', '-t500x500') : 'https://placehold.co/500x500/121212/1DB954?text=DarkSound'
      });
    }

    return res.status(500).json({ error: 'Errore durante la generazione dello stream' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Errore del server' });
  }
}
