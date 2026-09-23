#!/usr/bin/env node
// ============================================================
// Gemini Literature Screening — CLI (Node >= 18)
// Same engine as the web UI (screening-core.js): parallel multi-key
// screening, criterion-level decision rule, consensus, resumable state.
//
//   node cli.mjs -i records.xlsx -o results.xlsx \
//       --inclusion ic.txt --exclusion ec.txt \
//       --gemini-keys keys.txt --models gemini:gemini-2.5-flash
//
// Run `node cli.mjs --help` for all options.
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const C = require('./screening-core.js');

const HELP = `
Kullanım: node cli.mjs -i <girdi> -o <çıktı> --inclusion <ic.txt> --exclusion <ec.txt> [seçenekler]

Girdi / çıktı
  -i, --input <dosya>           CSV / TSV / TXT (WoS tab-delimited) / XLSX / XLS
  -o, --output <dosya>          .csv, .xlsx veya .json
      --inclusion <dosya>       IC ölçütleri (her satır bir ölçüt → IC1, IC2 …)
      --exclusion <dosya>       EC ölçütleri (her satır bir ölçüt → EC1, EC2 …)
      --guidance <dosya>        İncelemeye özgü yönerge (varsayılan: default-prompt.js)
      --topic <metin|dosya>     Kendi araştırma konunuz (yakınlık skoru için)

Modeller ve anahtarlar
      --models <liste>          sağlayıcı:model, virgülle (ör. gemini:gemini-2.5-flash,openai:gpt-4o-mini)
                                varsayılan: gemini:gemini-2.5-flash
      --gemini-keys <dosya>     Her satırda bir anahtar. Alternatif: GEMINI_API_KEYS (virgül/satır ayrımlı)
      --openai-keys <dosya>     veya OPENAI_API_KEYS
      --deepseek-keys <dosya>   veya DEEPSEEK_API_KEYS
      --base-url <sağl.=url>    Özel endpoint (ör. openai=https://openrouter.ai/api/v1), tekrarlanabilir

Paralellik ve limitler
      --batch-size <n>          İstek başına kayıt (varsayılan 5)
      --concurrency <n>         Anahtar başına eşzamanlı istek (varsayılan 1)
      --rpm <n>                 Anahtar başına dakikalık istek sınırı (0 = sınırsız, 429 ile yönetilir)
      --rpd <n>                 Anahtar başına günlük istek sınırı (0 = sınırsız)
      --min-interval <sn>       Aynı anahtarda istekler arası minimum bekleme

Karar mantığı
      --ic-logic all|any        IC birleşimi: tümü (VE, varsayılan) / en az biri (VEYA)
      --consensus <strateji>    unanimous (varsayılan) | majority | any_include
      --review-threshold <x>    Bu güvenin altı insan incelemesine (varsayılan 0.85)
      --summary-language <dil>  Turkish (varsayılan) | English — kısa gerekçe dili
      --temperature <x>         Boş bırakılırsa otomatik
      --no-dedupe               Tekrar ayıklamayı kapat
      --skip-no-abstract        Özetsiz kayıtları taramadan Uncertain işaretle
      --no-verify-evidence      Kanıt alıntısı doğrulamasını kapat
      --no-schema               Gemini responseSchema kullanma

Durum
      --state <dosya>           Devam dosyası (varsayılan: <çıktı>.state.json)
      --resume                  Kayıtlı durumdan devam et
      --retry-errors            Devam ederken API hatalı kayıtları yeniden tara
      --estimate-only           Yalnızca kayıt/istek/token tahmini
  -h, --help
`;

// ------------------------------------------------------------ args
const { values: a } = parseArgs({
  options: {
    input: { type: 'string', short: 'i' }, output: { type: 'string', short: 'o' },
    inclusion: { type: 'string' }, exclusion: { type: 'string' }, guidance: { type: 'string' }, topic: { type: 'string' },
    models: { type: 'string' }, 'gemini-keys': { type: 'string' }, 'openai-keys': { type: 'string' }, 'deepseek-keys': { type: 'string' },
    'base-url': { type: 'string', multiple: true },
    'batch-size': { type: 'string' }, concurrency: { type: 'string' }, rpm: { type: 'string' }, rpd: { type: 'string' }, 'min-interval': { type: 'string' },
    'ic-logic': { type: 'string' }, consensus: { type: 'string' }, 'review-threshold': { type: 'string' },
    'summary-language': { type: 'string' }, temperature: { type: 'string' },
    'no-dedupe': { type: 'boolean' }, 'skip-no-abstract': { type: 'boolean' }, 'no-verify-evidence': { type: 'boolean' }, 'no-schema': { type: 'boolean' },
    state: { type: 'string' }, resume: { type: 'boolean' }, 'retry-errors': { type: 'boolean' }, 'estimate-only': { type: 'boolean' },
    help: { type: 'boolean', short: 'h' }
  },
  allowPositionals: false
});

if (a.help || !a.input) { console.log(HELP); process.exit(a.help ? 0 : 1); }

const die = msg => { console.error(`✗ ${msg}`); process.exit(1); };
const readText = f => fs.readFileSync(f, 'utf8');
const readMaybeFile = v => (v && fs.existsSync(v) ? readText(v) : v || '');
const hash = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 8);

// ------------------------------------------------------------ input
function parseDelimited(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/, 1)[0] || '';
  const counts = { '\t': (first.match(/\t/g) || []).length, ',': (first.match(/,/g) || []).length, ';': (first.match(/;/g) || []).length };
  const delim = Object.entries(counts).sort((x, y) => y[1] - x[1])[0][0];
  const rows = [];
  let row = [], cur = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; } else cur += ch;
    } else if (ch === '"' && cur === '') inQ = true;
    else if (ch === delim) { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some(c => c.trim())) rows.push(row);
      row = [];
    } else cur += ch;
  }
  row.push(cur);
  if (row.some(c => c.trim())) rows.push(row);
  return rows;
}

async function loadXlsx() {
  try { return (await import('xlsx')).default || (await import('xlsx')); } catch (e) {
    die('Excel desteği için bu klasörde "npm install" çalıştırın (xlsx paketi gerekli) ya da dosyayı CSV olarak kaydedin.');
  }
}

async function readRows(file) {
  if (/\.(xlsx|xls)$/i.test(file)) {
    const X = await loadXlsx();
    const wb = X.read(fs.readFileSync(file), { type: 'buffer' });
    return X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '', raw: false });
  }
  return parseDelimited(readText(file));
}

function keysFromEnvOrFile(file, envName) {
  const txt = file ? readText(file) : (process.env[envName] || '');
  return txt.split(/[\r\n,]+/).map(s => s.trim()).filter(s => s && !s.startsWith('#')).map(s => s.split(/\s+/)[0]);
}

// ------------------------------------------------------------ setup
const DEFAULT_BASE = { gemini: 'https://generativelanguage.googleapis.com/v1beta', openai: 'https://api.openai.com/v1', deepseek: 'https://api.deepseek.com' };
const baseUrls = Object.assign({}, DEFAULT_BASE);
(a['base-url'] || []).forEach(s => { const [p, ...u] = s.split('='); baseUrls[p] = u.join('='); });

const models = (a.models || 'gemini:gemini-2.5-flash').split(',').map(s => s.trim()).filter(Boolean).map(s => {
  const [provider, ...rest] = s.split(':');
  const apiModel = rest.join(':');
  if (!DEFAULT_BASE[provider] || !apiModel) die(`Geçersiz model tanımı: "${s}" (biçim sağlayıcı:model)`);
  return { id: `${provider}:${apiModel}`, provider, apiModel, baseUrl: baseUrls[provider], pool: provider };
});

let guidance;
if (a.guidance) guidance = readText(a.guidance);
else {
  globalThis.window = globalThis.window || {};
  require('./default-prompt.js');
  guidance = globalThis.window.DEFAULT_SYSTEM_PROMPT;
}
const icText = a.inclusion ? readText(a.inclusion) : (a.guidance ? '' : globalThis.window.DEFAULT_INCLUSION);
const ecText = a.exclusion ? readText(a.exclusion) : (a.guidance ? '' : globalThis.window.DEFAULT_EXCLUSION);
const criteria = C.parseCriteria(icText, ecText);
if (!criteria.inclusion.length) die('En az bir dahil etme ölçütü gerekli (--inclusion).');

const temperature = a.temperature === undefined ? null : parseFloat(a.temperature);
const options = {
  icLogic: a['ic-logic'] === 'any' ? 'any' : 'all',
  reviewThreshold: a['review-threshold'] ? parseFloat(a['review-threshold']) : 0.85,
  consensus: a.consensus || 'unanimous',
  summaryLanguage: a['summary-language'] || 'Turkish',
  verifyEvidence: !a['no-verify-evidence'],
  requireEvidence: true,
  userTopic: readMaybeFile(a.topic).trim(),
  noAbstractMode: a['skip-no-abstract'] ? 'skip' : 'screen',
  dedupe: !a['no-dedupe'],
  temperature
};
const system = C.buildSystemInstructions(guidance, criteria, options);
const promptHash = hash(system);
C.checkGuidanceConsistency(guidance, criteria).forEach(w => console.warn(`⚠️  ${w}`));

const rows = await readRows(a.input);
const prepared = C.prepareRecords(rows, { dedupe: options.dedupe });
const fileHash = hash(prepared.records.map(r => `${r.ID}|${r.Title}`).join('\n'));
const batchSize = Math.max(1, parseInt(a['batch-size'] || '5', 10));
console.log(`📄 ${path.basename(a.input)}: ${prepared.records.length} kayıt, ${prepared.duplicates} tekrar · sütunlar: ${JSON.stringify(prepared.columns)}`);
console.log(`🧾 Prompt v${promptHash} · ${criteria.inclusion.length} IC / ${criteria.exclusion.length} EC · IC mantığı: ${options.icLogic} · modeller: ${models.map(m => m.id).join(', ')}`);

const toScreenAll = prepared.records.filter(r => !r.duplicateOf && !(r.noAbstract && options.noAbstractMode === 'skip'));
if (a['estimate-only']) {
  const sysT = C.estimateTokens(system);
  const reqs = Math.ceil(toScreenAll.length / batchSize);
  const inT = reqs * sysT + toScreenAll.reduce((s, r) => s + C.estimateTokens(C.recordText(r)), 0);
  console.log(`Taranacak: ${toScreenAll.length} · model başına istek: ${reqs} · model başına ~${(inT / 1e6).toFixed(2)}M input token`);
  process.exit(0);
}
if (!a.output) die('--output gerekli.');

// ------------------------------------------------------------ state
const statePath = a.state || `${a.output}.state.json`;
let results = new Map();
let usage = { input: 0, output: 0, perModel: {} };
let createdAt = new Date().toISOString();
if (a.resume && fs.existsSync(statePath)) {
  const s = JSON.parse(readText(statePath));
  if (s.promptHash !== promptHash) die(`Kayıtlı durum farklı bir prompt sürümüyle üretilmiş (v${s.promptHash} ≠ v${promptHash}). Aynı ölçüt/yönerge dosyalarını kullanın ya da --state ile yeni dosya verin.`);
  if (s.fileHash !== fileHash) die('Kayıtlı durum farklı bir girdi dosyasına ait.');
  results = new Map(s.results.map(r => [r.rid, r]));
  usage = s.usage || usage;
  createdAt = s.createdAt || createdAt;
  if (a['retry-errors']) [...results.values()].filter(r => r.error && !r.preset).forEach(r => results.delete(r.rid));
  console.log(`↺ Devam: ${results.size} kayıt hazır.`);
} else if (fs.existsSync(statePath) && !a.resume) {
  console.warn(`⚠️  ${statePath} mevcut; üzerine yazılacak (devam etmek için --resume).`);
}

prepared.records.forEach(r => {
  if (results.has(r.rid)) return;
  if (r.duplicateOf) results.set(r.rid, C.presetResult(r, 'Duplicate', `Tekrar kaydı: ${r.duplicateOf}`));
  else if (r.noAbstract && options.noAbstractMode === 'skip') results.set(r.rid, C.presetResult(r, 'Uncertain', 'Özet yok — insan incelemesi gerekli.'));
});

const run = {
  version: C.VERSION, createdAt, mode: 'sync', fileName: path.basename(a.input), fileHash,
  activeModels: models.map(m => m.id), models, criteria, options, system, promptHash, batchSize,
  records: prepared.records, usage
};
function saveState() {
  const tmp = `${statePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ promptHash, fileHash, createdAt, usage, results: [...results.values()] }));
  fs.renameSync(tmp, statePath);
}

// ------------------------------------------------------------ pools
const envName = { gemini: 'GEMINI_API_KEYS', openai: 'OPENAI_API_KEYS', deepseek: 'DEEPSEEK_API_KEYS' };
const pools = {};
[...new Set(models.map(m => m.pool))].forEach(p => {
  let keys = keysFromEnvOrFile(a[`${p}-keys`], envName[p]);
  if (!keys.length && p === 'gemini' && process.env.GEMINI_API_KEY) keys = [process.env.GEMINI_API_KEY];
  if (!keys.length) die(`${p} için anahtar yok (--${p}-keys dosyası ya da ${envName[p]} ortam değişkeni).`);
  const limits = {};
  models.filter(m => m.pool === p).forEach(m => { limits[m.apiModel] = { rpm: parseInt(a.rpm || '0', 10), rpd: parseInt(a.rpd || '0', 10) }; });
  pools[p] = new C.KeyPool(p, keys, {
    concurrencyPerKey: Math.max(1, parseInt(a.concurrency || '1', 10)),
    minIntervalMs: (parseFloat(a['min-interval'] || '0') || 0) * 1000,
    limits
  });
  console.log(`🔑 ${p}: ${pools[p].size} anahtar × ${pools[p].opts.concurrencyPerKey} eşzamanlı`);
});

// ------------------------------------------------------------ run
const todo = prepared.records.filter(r => !results.has(r.rid));
const ac = new AbortController();
let stopping = false;
process.on('SIGINT', () => {
  if (stopping) process.exit(130);
  stopping = true;
  console.log('\n⏸  Durduruluyor… (tekrar Ctrl+C = hemen çık). Durum kaydedilecek; --resume ile devam edin.');
  ac.abort();
});

let lastSave = Date.now();
let lastPrint = 0;
const t0 = Date.now();
console.log(`🚀 ${todo.length} kayıt taranacak…`);
const res = todo.length ? await C.runScreening({
  records: todo, models, pools, system, batchSize, temperature,
  useSchema: !a['no-schema'],
  validation: Object.assign({ criteria }, options),
  signal: ac.signal,
  onRecord: row => {
    results.set(row.rid, row);
    if (Date.now() - lastSave > 5000) { saveState(); lastSave = Date.now(); }
  },
  onUsage: (id, u) => {
    usage.input += u.promptTokens || 0; usage.output += u.completionTokens || 0;
    const pm = usage.perModel[id] = usage.perModel[id] || { input: 0, output: 0 };
    pm.input += u.promptTokens || 0; pm.output += u.completionTokens || 0;
  },
  onProgress: p => {
    if (Date.now() - lastPrint < 2000) return;
    lastPrint = Date.now();
    const done = results.size, total = prepared.records.length;
    const rate = (done - (prepared.records.length - todo.length)) / ((Date.now() - t0) / 60000 || 1);
    process.stdout.write(`\r⏳ ${done}/${total} (${Math.round(done / total * 100)}%) · uçuşta ${p.inflight} · ${rate.toFixed(1)} kayıt/dk   `);
  },
  onLog: m => console.log(`\n   ${m}`),
  onFatal: e => console.error(`\n⛔ ${e.message}`)
}) : { completed: true };
saveState();
process.stdout.write('\n');

// ------------------------------------------------------------ output
const sorted = [...results.values()].sort((x, y) => x.order - y.order);
const exportRows = C.buildExportRows(run, sorted);
const meta = C.buildMetadataRows(run, sorted);
const ext = path.extname(a.output).toLowerCase();
if (ext === '.json') {
  fs.writeFileSync(a.output, JSON.stringify({ metadata: Object.fromEntries(meta.slice(1).filter(([k]) => k)), results: sorted }, null, 2));
} else if (ext === '.xlsx') {
  const X = await loadXlsx();
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, X.utils.json_to_sheet(exportRows), 'Screening');
  X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(meta.map(([k, v]) => [k, typeof v === 'string' && v.length > 32000 ? v.slice(0, 32000) + ' …' : v])), 'Metadata');
  X.writeFile(wb, a.output);
} else {
  const headers = Object.keys(exportRows[0] || {});
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const metaTxt = meta.slice(1).filter(([k]) => k !== 'Sistem talimatı (tam metin)').map(([k, v]) => `# ${k}: ${String(v).replace(/[\r\n]+/g, ' ')}`).join('\n');
  fs.writeFileSync(a.output, '﻿' + metaTxt + '\n' + [headers.map(esc).join(','), ...exportRows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n'));
}

const count = d => sorted.filter(r => r.decision === d).length;
const errs = sorted.filter(r => r.error).length;
console.log(`✅ ${a.output} yazıldı · Include ${count('Include')} · Exclude ${count('Exclude')} · Uncertain ${count('Uncertain')} · Duplicate ${count('Duplicate')} · inceleme ${sorted.filter(r => r.needs_human_review).length}${errs ? ` · API hatası ${errs} (--resume --retry-errors)` : ''}`);
console.log(`   Token: ${usage.input.toLocaleString()} input / ${usage.output.toLocaleString()} output`);
C.agreementStats(sorted, run.activeModels).forEach(p => console.log(`   κ(${p.a}, ${p.b}) = ${p.kappa.toFixed(3)} (uyum %${(p.observed * 100).toFixed(1)}, n=${p.n})`));
Object.values(pools).forEach(p => p.status().forEach(s => console.log(`   ${s.label}: ${s.status} · istek ${s.stats.requests}, 429 ${s.stats.rateLimited}, hata ${s.stats.errors}`)));
if (!res.completed) { console.log(`⏸  Tamamlanmadı. Devam: node cli.mjs … --resume`); process.exit(2); }
