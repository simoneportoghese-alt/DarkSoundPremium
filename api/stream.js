export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Manca la ricerca' });
  }

  // Lista di istanze pubbliche di backup per garantire massima stabilità
  const instances = [
    'https://inv.iosbb.org',
    'https://invidious.nerdvpn.de',
    'https://invidious.drgns.space'
  ];

  for (const baseUrl of instances) {
    try {
      // 1. Cerca il brano
      const searchRes = await fetch(`${baseUrl}/api/v1/search?q=${encodeURIComponent(q)}&type=video`);
      const searchData = await searchRes.json();

      if (!searchData || searchData.length === 0) continue;

      const videoId = searchData[0].videoId;

      // 2. Prendi i dettagli e lo stream audio
      const videoRes = await fetch(`${baseUrl}/api/v1/videos/${videoId}`);
      const videoData = await videoRes.json();

      if (videoData && videoData.adaptiveFormats) {
        // Cerca la traccia audio con la qualità migliore
        const audioFormat = videoData.adaptiveFormats
          .filter(f => f.type && f.type.includes('audio'))
          .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

        if (audioFormat && audioFormat.url) {
          // Reindirizza direttamente all'audio funzionante
          return res.redirect(302, audioFormat.url);
        }
      }
    } catch (e) {
      console.log(`Fallback istanza ${baseUrl} fallito, provo la successiva...`);
    }
  }

  return res.status(500).json({ error: 'Impossibile recuperare lo stream al momento.' });
}
