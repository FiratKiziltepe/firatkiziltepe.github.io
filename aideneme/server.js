const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Statik dosyaları serve et
app.use(express.static('./'));

// Ana sayfayı göster
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Sunucuyu başlat
app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
}); 