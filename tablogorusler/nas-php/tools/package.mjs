import { readFileSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
const index = readFileSync('public/index.html', 'utf8');
const currentBundle = index.match(/assets\/(index-[^"\s]+\.js)/)?.[1];
const currentCss = index.match(/assets\/(index-[^"\s]+\.css)/)?.[1];
if (!currentBundle || !currentCss) throw new Error('Derlenmiş uygulama veya stil dosyası bulunamadı.');
// Remove only generated artifacts in this NAS copy; preserve the PHP entrypoints.
for (const file of readdirSync('public/assets')) {
  if ((/^index-.*\.js$/.test(file) && file!==currentBundle) ||
      (/^index-.*\.css$/.test(file) && file!==currentCss) ||
      ['styles.css','fonts.css'].includes(file)) unlinkSync(path.join('public/assets',file));
}
for (const file of [currentBundle,currentCss]) {
  if (/supabase\.co|@supabase|cdn\.tailwindcss\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(readFileSync(path.join('public/assets',file),'utf8'))) throw new Error('Harici çalışma zamanı bağlantısı bulundu.');
}
console.log('Bağımsız NAS derlemesi hazır; stil ve fontlar yerel.');
