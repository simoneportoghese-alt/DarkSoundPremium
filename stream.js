export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Manca la canzone (q)' });
  }

  try {
    const searchUrl = `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=music_songs`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      return res.status(404).json({ error: 'Nessun brano trovato' });
    }

    const videoId = searchData.items[0].url.split('v=')[1];
    const streamUrl = `https://pipedapi.kavin.rocks/streams/${videoId}`;
    const streamRes = await fetch(streamUrl);
    const streamData = await streamRes.json();

    const audioStream = streamData.audioStreams.find(s => s.mimeType.includes('audio/mp4')) || streamData.audioStreams[0];

    if (!audioStream) {
      return res.status(404).json({ error: 'Stream non disponibile' });
    }

    return res.redirect(302, audioStream.url);

  } catch (error) {
    return res.status(500).json({ error: 'Errore server' });
  }
}
