const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware per i file statici della web app
app.use(express.static(path.join(__dirname, 'public')));

// 1. PROXY LIBERO (Senza chiave) - Per flussi pubblici, audio e video
app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).json({ error: 'URL mancante' });
    }

    try {
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        const data = await response.text();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
        return res.status(response.status).send(data);
    } catch (error) {
        console.error('Errore proxy:', error);
        res.status(500).json({ error: 'Errore proxy' });
    }
});

// 2. ROTTA DEDICATA ALLE STATISTICHE (Usa la tua chiave) - Solo per visualizzazioni e follower
app.get('/api/stats', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).json({ error: 'URL mancante' });
    }

    try {
        // Prende la chiave in modo sicuro dalle variabili d'ambiente di Railway
        const miaChiave = process.env.MIA_CHIAVE_API;

        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                // La chiave viene inserita esclusivamente qui
                'Authorization': `Bearer ${miaChiave}`
            }
        });
        
        const data = await response.text();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
        return res.status(response.status).send(data);
    } catch (error) {
        console.error('Errore stats:', error);
        res.status(500).json({ error: 'Errore nel recupero delle statistiche' });
    }
});

// Rotta catch-all per la Single Page Application
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Avvio del server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ DarkSound Pro running on port ${PORT}`);
});
