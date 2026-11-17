"""Mevcut uygulamayı tek HTML dosyasında paketler. Python standart kütüphanesi yeterlidir."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text()
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">',
              lambda m: '<style>\n' + (root / m[1]).read_text() + '\n</style>', html)
html = re.sub(r'<script src="(js/[^"]+)"></script>',
              lambda m: '<script>\n' + (root / m[1]).read_text() + '\n</script>', html)
html = html.replace('<title>Bağlam</title>', '<title>Bağlam — Araştırma yolculuğu</title>')
(root / 'baglam-hero.html').write_text(html)
print('baglam-hero.html oluşturuldu.')
