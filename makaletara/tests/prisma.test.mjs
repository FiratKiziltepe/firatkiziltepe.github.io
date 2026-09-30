import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const P = require('../prisma.js');

const NB = ' ';
const plain = svg => svg.split(NB).join(' ');

const data = {
  sources: [{ label: 'Web of Science', n: 1928 }, { label: 'Scopus', n: 410 }], registers: 0,
  duplicates: 121, automation: 0, otherRemoved: 3, screened: 2214,
  excluded: 1660, excludedHuman: 1492, excludedAuto: 168,
  sought: 554, notRetrieved: 4, assessed: 550, reasons: [{ label: 'Wrong population', n: 40 }],
  included: 510, reportsIncluded: 510
};

test('PRISMA 2020 flow: template boxes, per-database counts, automation split', () => {
  const svg = plain(P.flowSvg(data, 'en').svg);
  assert.equal((svg.match(/<rect /g) || []).length, 14);   // background, header, 3 side bars, 9 boxes
  assert.equal((svg.match(/<line /g) || []).length, 8);    // 4 down, 4 across
  for (const t of ['Identification of studies via databases and registers', 'Records identified from*:',
    'Databases (n = 2,338)', 'Web of Science (n = 1,928)', 'Registers (n = 0)', 'Duplicate records removed (n = 121)',
    'Records screened (n = 2,214)', 'Records excluded** (n = 1,660)', '168 by automation tools',
    'Reports sought for retrieval (n = 554)', 'Wrong population (n = 40)', 'Studies included in review (n = 510)', 'bmj.n71']) {
    assert.ok(svg.includes(t), t);
  }
});

test('PRISMA 2020 flow: counts never split across lines', () => {
  const long = Object.assign({}, data, { sources: [{ label: 'A very long database name that forces the box to wrap its text', n: 1928 }] });
  const texts = [...P.flowSvg(long, 'en').svg.matchAll(/>([^<]*)<\/text>/g)].map(m => m[1]);
  texts.forEach(t => {
    assert.ok(!/\(n$/.test(t) && !/^=/.test(t) && !/^[\d,.]+\)$/.test(t), `split count: "${t}"`);
  });
  assert.ok(texts.some(t => t.includes(`(n${NB}=${NB}1,928)`)));
});

test('PRISMA 2020 flow: Turkish labels, Turkish number format, escaping, empty reasons', () => {
  const svg = plain(P.flowSvg(Object.assign({}, data, { reasons: [], sources: [{ label: 'A & <B>', n: 1928 }] }), 'tr').svg);
  assert.ok(svg.includes('Taranan kayıtlar (n = 2.214)'));
  assert.ok(svg.includes('A &amp; &lt;B&gt; (n = 1.928)'));
  assert.ok(svg.includes('Neden 1 (n = )'));
  assert.ok(svg.includes('168 otomasyon araçlarıyla'));
});
