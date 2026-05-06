# Gemini Literatür Tarama Aracı

Sistematik literatür taraması için Google Gemini API destekli, akademik çalışmalara uygun otomatik tarama platformu. Hem **web arayüzü** (`index.html`) hem **terminal/CLI** (`cli.py`) sürümleri ile gelir; her ikisi de aynı motoru ve aynı çıktı formatını kullanır.

20.000+ makaleli sistematik tarama projeleri için optimize edilmiştir.

---

## Öne Çıkan Özellikler

- **Çoklu model seçimi**: Gemini 3.1 Pro / 3.1 Flash Lite / 2.5 Flash / 2.5 Flash Lite
- **Gerçek batch işleme**: Tek API isteğinde N makale (token tasarrufu, kotayı verimli kullanma)
- **Async Batch API desteği**: %50 indirim, rate limit yok, 24 saate kadar çalışan büyük işler
- **Maliyet hesaplama**: Analiz öncesi tahmini USD maliyet, analiz sırasında canlı token/maliyet paneli
- **Zenginleştirilmiş JSON şeması**: `decision`, `confidence`, eşleşen `IC/EC` kodları, `needs_human_review`, `rationale`
- **Token tasarrufu**: Title/Abstract/Authors/Year API'den dönmez, dosyadan korunur
- **Prompt versiyonlama**: Sistem promptunun SHA-256 hash'i çıktıya gömülür → reproducibility
- **Devam ettirme (resume)**: Sync veya async modda yarım kalan analiz state dosyasından devam eder
- **Sağlam CSV/TSV/Excel parser**: Otomatik delimiter (tab/virgül/noktalı virgül) tespiti, RFC 4180 uyumlu
- **Filtreleme**: Web arayüzünde karara göre + serbest metin arama
- **Güvenlik**: API key sadece `sessionStorage`'da, çıktılar `textContent` ile XSS-safe render edilir
- **Çıktı**: CSV (UTF-8 BOM) + Excel (Screening + Metadata sheet'leri ile)

---

## Kurulum

### Web sürümü
Hiçbir kurulum gerekmez. `index.html` dosyasını modern bir tarayıcıda açın.

### CLI sürümü
```bash
# Python 3.9+ gerekli
pip install -r requirements.txt
```

`requirements.txt` içeriği:
- `requests>=2.31.0` — HTTP istekleri
- `pandas>=2.0.0` — CSV/Excel okuma/yazma
- `openpyxl>=3.1.0` — Excel motoru

### Gemini API Key
1. [Google AI Studio](https://aistudio.google.com/app/apikey) → "Create API Key"
2. Web: arayüzdeki **"Gemini API Key"** alanına yapıştır (sessionStorage)
3. CLI: `--api-key` parametresi **veya** ortam değişkeni:
   ```bash
   # Linux / macOS
   export GEMINI_API_KEY="AIza..."

   # Windows PowerShell
   $env:GEMINI_API_KEY = "AIza..."
   ```

---

## Web Arayüzü Kullanımı

1. `index.html` dosyasını tarayıcıda aç
2. API key'i gir
3. Modeli ve modu seç (sync = anlık | async = batch API, %50 indirimli)
4. IC ve EC kriterlerini her satıra bir tane gelecek şekilde yaz
5. CSV/TSV/XLSX dosyanı yükle
6. **Maliyet tahmini** panelinden Standard ve Batch tier maliyetlerini gör
7. **Analizi Başlat** → canlı ilerleme + token/maliyet paneli
8. CSV / Excel olarak indir (her ikisi de prompt versiyonu ve metadata içerir)

---

## CLI Kullanımı

### En basit kullanım (sync)
```bash
python cli.py \
    --input articles.xlsx \
    --output results.xlsx \
    --inclusion ic.txt \
    --exclusion ec.txt \
    --model gemini-3.1-flash-lite-preview \
    --mode sync
```

### Async Batch API (önerilen, büyük veri setleri için)
```bash
python cli.py \
    --input articles.xlsx \
    --output results.xlsx \
    --inclusion ic.txt \
    --exclusion ec.txt \
    --mode async
# Job submit edilir, polling başlar. Ctrl+C ile durdurabilirsin (state kaydedilir).
```

### Yarım kalan analizi devam ettir
```bash
python cli.py --resume \
    --input articles.xlsx \
    --output results.xlsx \
    --inclusion ic.txt \
    --exclusion ec.txt
```

### Sadece maliyet tahmini (analiz başlatmadan)
```bash
python cli.py \
    --input articles.xlsx \
    --inclusion ic.txt \
    --exclusion ec.txt \
    --estimate-only
```

### Tüm CLI parametreleri
| Parametre | Varsayılan | Açıklama |
|-----------|-----------|----------|
| `-i, --input` | — | CSV/TSV/XLSX girdi dosyası |
| `-o, --output` | — | Sonuç dosyası (CSV veya XLSX) |
| `--inclusion` | — | IC kriterleri (her satır = 1 kriter, otomatik IC1, IC2... numaralanır) |
| `--exclusion` | — | EC kriterleri (otomatik EC1, EC2... numaralanır) |
| `--model` | `gemini-3.1-flash-lite-preview` | Bkz. [Modeller](#modeller) |
| `--mode` | `sync` | `sync` veya `async` |
| `--batch-size` | `5` | Sync modda tek istekte makale sayısı |
| `--delay` | `2.0` | Sync modda batch'ler arası bekleme (saniye) |
| `--api-key` | `$GEMINI_API_KEY` | API key |
| `--state-file` | `.screening_state.json` | Resume için state dosyası |
| `--resume` | — | State dosyasından devam et |
| `--estimate-only` | — | Sadece maliyet tahmini yap |
| `--poll-interval` | `60` | Async polling aralığı (saniye) |

### Kriter dosyası örneği
`ic.txt`:
```
Çalışma randomize kontrollü deneme (RCT) olmalı
İnsan katılımcılarla yapılmış olmalı
2015 sonrası yayınlanmış olmalı
```
→ Otomatik olarak `IC1`, `IC2`, `IC3` olarak kodlanır.

---

## Girdi Dosyası Formatı

CSV / TSV / XLSX desteklenir. Delimiter (tab, virgül, noktalı virgül) **otomatik algılanır**.

**Zorunlu sütunlar:** `Title`, `Abstract`
**Opsiyonel sütunlar:** `ID`, `Authors`, `Year` (case-insensitive)

CSV örneği:
```csv
ID,Title,Abstract,Authors,Year
1,"Article title here","Abstract text...","Smith J, Doe A",2023
2,"Another article","Another abstract...","Lee K",2024
```

---

## Çıktı Formatı

### Veri sütunları
| Sütun | Kaynak | Açıklama |
|-------|--------|----------|
| ID | Dosyadan | Makale ID'si |
| Yazar(lar) | Dosyadan | — |
| Başlık | Dosyadan | — |
| Yıl | Dosyadan | — |
| Abstract (Orijinal) | Dosyadan | Token tasarrufu için API'den gelmez |
| Türkçe Özet | API'den | `summary_tr` |
| Karar | API'den | `Include` / `Exclude` / `Uncertain` |
| Güven | API'den | 0.00 – 1.00 |
| IC | API'den | Eşleşen dahil etme kodları (IC1; IC3) |
| EC | API'den | Eşleşen hariç tutma kodları (EC2) |
| İnceleme | API'den | İnsan incelemesi gerekli mi (Yes/No) |
| Gerekçe | API'den | `rationale` |
| Prompt Versiyon | Hesaplanır | Sistem promptunun SHA-256[0:8] hash'i |

### Reproducibility — Metadata
Her çıktı dosyasında prompt versiyonu ve tüm parametreler gömülüdür:
- **Excel**: ayrı `Metadata` sheet'i (model, mod, tier, prompt hash, IC/EC kriterleri, tam sistem promptu, token kullanımı, maliyet)
- **CSV**: dosyanın başına `#` ile başlayan yorum satırları olarak

Aynı prompt + aynı kriterler = aynı hash. Hash farklıysa karşılaştırılan iki tarama farklı promptla çalıştırılmıştır.

---

## Modeller

| Model | Standard ($/1M token) | Batch ($/1M, %50 indirim) | Free Tier RPD | TPM |
|-------|----------------------|---------------------------|---------------|-----|
| Gemini 3.1 Pro (Preview) | $2.00 in / $12.00 out | $1.00 / $6.00 | — (paid only) | — |
| Gemini 3.1 Flash Lite | $0.25 / $1.50 | $0.125 / $0.75 | 500 | 250.000 |
| Gemini 2.5 Flash | $0.30 / $2.50 | $0.15 / $1.25 | 20 (free) | 250.000 |
| Gemini 2.5 Flash Lite | $0.10 / $0.40 | $0.05 / $0.20 | 20 (free) | 250.000 |

> Fiyatlar [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing) sayfasındaki resmi değerlerdir. Free Tier kotanızdaysanız maliyet $0'dır.

### Mod karşılaştırması

| Özellik | Sync | Async (Batch API) |
|---------|------|-------------------|
| Hız | Anlık (saniyeler) | 1–24 saat |
| Fiyat | Standard | %50 indirim |
| Rate limit | RPM/RPD'ye tabi | Yok |
| 20K makale için | Önerilmez | Önerilir |
| Devam ettirme | Batch index'ten | Job ID'den polling |

---

## Akademik Kullanım Notları

Bu araç tamamen otomatik karar verici değil, **AI-assisted title/abstract screening workspace** olarak konumlandırılmıştır:

- Her sonuçta `confidence` ve `needs_human_review` flag'i bulunur
- `Uncertain` kararları + düşük `confidence` skorları manuel inceleme için işaretlenir
- IC/EC kodları gerekçeyle birlikte kayıt edilir → PRISMA raporlamasında kullanılabilir
- Prompt hash ile reproducibility sağlanır → makale yöntem bölümünde belirtilebilir
- Önerilen iş akışı: Model ön karar verir → Include + Uncertain kayıtları insan doğrular

---

## Güvenlik

- **API key**: Web'de `sessionStorage` (tarayıcı kapanınca silinir), CLI'da env veya parametre
- **Veri**: Doğrudan tarayıcıdan/terminalden Google'a gider, üçüncü partiye gönderilmez
- **XSS**: Tüm dinamik içerik `textContent` ile render edilir

---

## Sorun Giderme

### "Rate limit (429)" hatası
- Sync modda `--batch-size`'ı küçült (5 → 3) veya `--delay`'i artır (2 → 5)
- En iyi çözüm: `--mode async` kullan (rate limit yok)

### JSON parse hatası
- Modelin `responseMimeType: application/json` ile çağrılması zorunlu kılınmıştır; nadiren olur
- Olursa o batch atlanır, sonuçlar boş bırakılır → tekrar `--resume` ile çalıştır

### Async job çok uzun sürüyor
- Normal — Google SLA 24 saate kadar olabilir
- `Ctrl+C` ile polling durdur, `--resume` ile geri dön (job arka planda çalışmaya devam eder)

### Sonuçlar beklediğim gibi değil
- IC/EC kriterlerini daha spesifik ve örneklerle yaz
- Sistem promptuna özel domain bilgisi ekle (`index.html`'de `systemPrompt` textarea'sı)

---

## Teknik Detaylar

### Web stack
- HTML5 + CSS3 (vanilla, framework yok)
- ES6+ JavaScript
- SheetJS (Excel okuma)

### CLI stack
- Python 3.9+ • `requests` • `pandas` • `openpyxl`

### API
- Endpoint: `generativelanguage.googleapis.com/v1beta`
- Sync: `:generateContent`
- Async: `:batchGenerateContent` (inline requests)
- Yapılandırma: `temperature=0.2`, `responseMimeType=application/json`

---

## Lisans

MIT
