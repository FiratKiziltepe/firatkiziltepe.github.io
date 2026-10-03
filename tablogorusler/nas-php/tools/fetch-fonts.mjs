import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('frontend/fonts', { recursive: true });
const response = await fetch('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap', {
  headers: { 'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
});
if (!response.ok) throw new Error('Inter font CSS indirilemedi');
let css = await response.text();
const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)\s]+/g))];
for (const [i, url] of urls.entries()) {
  const result = await fetch(url);
  if (!result.ok) throw new Error('Inter font indirilemedi');
  const filename = `inter-${i}.woff2`;
  writeFileSync(`frontend/fonts/${filename}`, Buffer.from(await result.arrayBuffer()));
  css = css.replaceAll(url, `./fonts/${filename}`);
}
writeFileSync('frontend/fonts.css', css);
console.log(`${urls.length} yerel font dosyası hazır.`);
