const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Servire i file statici dalla stessa directory
app.use(express.static(path.join(__dirname)));

// Per qualsiasi richiesta, servire index.html (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`✅ Server DarkSound running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
});
