const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware per i file statici della tua web app
app.use(express.static(path.join(__dirname, 'public')));

// --- PROXY CORS INTEGRATO ---
// Invece di un file separato, gestiamo la rotta /api/proxy qui dentro
app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).json({ error: 'URL mancante' });
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        
        const data = await response.text();
        
        // Invia gli header CORS per sbloccare le richieste dal frontend
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
        
        return res.status(response.status).send(data);
    } catch (error) {
        console.error('Errore proxy:', error);
        res.status(500).json({ error: 'Errore durante il proxy della richiesta' });
    }
});
// ----------------------------

// Rotta catch-all per la Single Page Application
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// IMPORTANTE: '0.0.0.0' permette a Railway di fare il bind corretto del traffico esterno
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ DarkSound Pro running on port ${PORT}`);
});
