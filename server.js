const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware per servire i file statici della cartella 'public' (HTML, CSS, JS del frontend)
app.use(express.static(path.join(__dirname, 'public')));

// --- PROXY CORS INTEGRATO ---
// Gestisce le richieste verso l'esterno (es. YouTube o altri servizi) senza blocchi CORS
app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).json({ error: 'URL mancante' });
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        const data = await response.text();
        
        // Imposta gli header CORS per permettere al frontend di leggere la risposta
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
        
        return res.status(response.status).send(data);
    } catch (error) {
        console.error('Errore proxy:', error);
        res.status(500).json({ error: 'Errore durante il proxy della richiesta' });
    }
});
// ----------------------------

// Rotta per la Single Page Application
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Avvio del server con il bind corretto su '0.0.0.0' per Railway
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ DarkSound Pro running on port ${PORT}`);
});
