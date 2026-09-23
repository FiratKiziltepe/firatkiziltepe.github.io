import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { screenRecordsFromPrompt } from './mock-api.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function startMock() {
  const hits = {};
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      const key = req.headers['x-goog-api-key'];
      hits[key] = (hits[key] || 0) + 1;
      const b = JSON.parse(body || '{}');
      const out = screenRecordsFromPrompt(b.contents[0].parts[0].text, { noSkip: true });
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(out) }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 10 } }));
    });
  });
  return new Promise(r => server.listen(0, () => r({ server, hits, port: server.address().port })));
}

function runCli(args, env = {}) {
  return new Promise(resolve => {
    const p = spawn(process.execPath, [path.join(ROOT, 'cli.mjs'), ...args], { env: { ...process.env, ...env } });
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { out += d; });
    p.on('close', code => resolve({ code, out }));
  });
}

test('CLI: parallel screening over several keys, CSV output and resume', async () => {
  const { server, hits, port } = await startMock();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gls-'));
  const rows = [['UT', 'Article Title', 'Abstract', 'Publication Year']];
  for (let i = 0; i < 24; i++) rows.push([`WOS:${i}`, `${i % 3 === 0 ? '[INC]' : i % 3 === 1 ? '[EC4]' : '[UNC]'} Paper ${i}`, `Students personal interests were surveyed in study ${i}.`, '2023']);
  fs.writeFileSync(path.join(dir, 'in.tsv'), rows.map(r => r.join('\t')).join('\n'));
  fs.writeFileSync(path.join(dir, 'keys.txt'), 'K1\nK2\nK3 # third project\n');
  const out = path.join(dir, 'out.csv');
  const args = ['-i', path.join(dir, 'in.tsv'), '-o', out, '--gemini-keys', path.join(dir, 'keys.txt'),
    '--models', 'gemini:gemini-test', '--base-url', `gemini=http://127.0.0.1:${port}/v1beta`, '--batch-size', '3', '--concurrency', '2'];
  const r1 = await runCli(args);
  assert.equal(r1.code, 0, r1.out);
  const csv = fs.readFileSync(out, 'utf8');
  assert.ok(csv.includes('# Prompt versiyonu'));
  assert.equal((csv.match(/"Include"/g) || []).length >= 8, true);
  assert.ok(Object.keys(hits).length === 3, JSON.stringify(hits));
  assert.ok(fs.existsSync(`${out}.state.json`));
  // resume: nothing left to do, no new requests
  const before = Object.values(hits).reduce((s, n) => s + n, 0);
  const r2 = await runCli([...args, '--resume']);
  assert.equal(r2.code, 0, r2.out);
  assert.equal(Object.values(hits).reduce((s, n) => s + n, 0), before);
  server.close();
});
