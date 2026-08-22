const express = require('express');
const path = require('path');

const app = express();

// Servi tutti i file statici dalla cartella 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rotta principale che restituisce index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Porta dinamica di Railway + binding su 0.0.0.0
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Server DarkSound Pro avviato su http://${HOST}:${PORT}`);
});
