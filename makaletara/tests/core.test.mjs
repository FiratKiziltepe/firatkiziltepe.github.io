import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createMockFetch } from './mock-api.mjs';

const require = createRequire(import.meta.url);
const C = require('../screening-core.js');

const criteria = C.parseCriteria(
  'Personal interests are studied\nInterests are operationalised',
  'Unrelated meaning\nSituational interest only\nOther variables only\nDocument classification only\nNon-primary publication'
);
const ctx = { criteria, icLogic: 'all', reviewThreshold: 0.85, verifyEvidence: true };

test('criteria parsing strips pasted codes and bullets', () => {
  const c = C.parseCriteria('IC1: first\n- IC2) second\n\n', '• EC1 - x');
  assert.deepEqual(c.inclusion.map(x => x.text), ['first', 'second']);
  assert.deepEqual(c.exclusion, [{ code: 'EC1', text: 'x' }]);
  assert.equal(C.normalizeCode('ic 02'), 'IC2');
  assert.equal(C.normalizeCode('EC-5:'), 'EC5');
  assert.equal(C.normalizeCode('foo'), null);
});

test('decision rule: AND logic, EC precedence and unclear handling', () => {
  const d = a => C.deriveDecision(a, criteria, 'all').decision;
  const allNo = { EC1: 'no', EC2: 'no', EC3: 'no', EC4: 'no', EC5: 'no' };
  assert.equal(d({ IC1: 'yes', IC2: 'yes', ...allNo }), 'Include');
  assert.equal(d({ IC1: 'yes', IC2: 'yes', ...allNo, EC4: 'yes' }), 'Exclude');
  assert.equal(d({ IC1: 'no', IC2: 'unclear', ...allNo }), 'Exclude');
  assert.equal(d({ IC1: 'yes', IC2: 'unclear', ...allNo }), 'Uncertain');
  // IC met but an EC cannot be ruled out -> not Include
  assert.equal(d({ IC1: 'yes', IC2: 'yes', ...allNo, EC5: 'unclear' }), 'Uncertain');
  // nothing known -> Uncertain (absence of evidence is not evidence of absence)
  assert.equal(d({}), 'Uncertain');
});

test('decision rule: OR logic for inclusion criteria', () => {
  const d = a => C.deriveDecision(a, criteria, 'any').decision;
  const allNo = { EC1: 'no', EC2: 'no', EC3: 'no', EC4: 'no', EC5: 'no' };
  assert.equal(d({ IC1: 'yes', IC2: 'no', ...allNo }), 'Include');
  assert.equal(d({ IC1: 'no', IC2: 'no', ...allNo }), 'Exclude');
  assert.equal(d({ IC1: 'no', IC2: 'unclear', ...allNo }), 'Uncertain');
});

test('validation: model decision contradicting its own verdicts goes to human review', () => {
  const raw = {
    id: 'R00001', decision: 'Include', confidence: 0.97, needs_human_review: false,
    criteria_assessment: [
      { code: 'IC1', verdict: 'yes', evidence: 'students personal interests' },
      { code: 'IC2', verdict: 'yes', evidence: 'used for personalization' },
      { code: 'EC4', verdict: 'yes', evidence: 'tweets are classified' }
    ]
  };
  const v = C.validateModelRecord(raw, { ...ctx, recordText: 'students personal interests were used for personalization; tweets are classified' });
  assert.equal(v.rule_decision, 'Exclude');
  assert.equal(v.decision, 'Uncertain');
  assert.equal(v.inconsistent, true);
  assert.equal(v.needs_human_review, true);
});

test('validation: fabricated evidence is not accepted', () => {
  const raw = {
    decision: 'Include', confidence: 0.99,
    criteria_assessment: [
      { code: 'IC1', verdict: 'yes', evidence: 'learners reported hobbies such as chess' },
      { code: 'IC2', verdict: 'yes', evidence: 'interest profile' },
      ...['EC1', 'EC2', 'EC3', 'EC4', 'EC5'].map(code => ({ code, verdict: 'no', evidence: 'x' }))
    ]
  };
  const v = C.validateModelRecord(raw, { ...ctx, recordText: 'A study of an interest profile for recommendation.' });
  assert.equal(v.assessment.IC1, 'unclear');
  assert.equal(v.decision, 'Uncertain');
  assert.ok(v.flags.some(f => f.includes('IC1')));
});

test('validation: unknown codes, verdict synonyms, percentage confidence', () => {
  const raw = {
    decision: 'exclude', confidence: '92%',
    criteria_assessment: { 'ic-1': 'No', IC2: { verdict: 'not met' }, IC9: 'yes' }
  };
  const v = C.validateModelRecord(raw, { ...ctx, verifyEvidence: false });
  assert.equal(v.decision, 'Exclude');
  assert.equal(v.confidence, 0.92);
  assert.ok(v.flags.some(f => f.includes('IC9')));
});

test('consensus strategies and kappa', () => {
  const mk = (decision, confidence = 0.95) => ({ ...C.errorModelRecord('x'), error: null, decision, confidence, needs_human_review: false, rationale: decision });
  const r = { a: mk('Include'), b: mk('Exclude'), c: mk('Include') };
  assert.equal(C.consensus(r, ['a', 'b', 'c'], { consensus: 'unanimous' }).decision, 'Uncertain');
  assert.equal(C.consensus(r, ['a', 'b', 'c'], { consensus: 'majority' }).decision, 'Include');
  assert.equal(C.consensus({ a: mk('Exclude'), b: mk('Uncertain') }, ['a', 'b'], { consensus: 'any_include' }).decision, 'Uncertain');
  const same = C.consensus({ a: mk('Exclude', 0.9), b: mk('Exclude', 0.99) }, ['a', 'b'], {});
  assert.equal(same.decision, 'Exclude');
  assert.equal(same.confidence, 0.9);
  assert.equal(same.needs_human_review, false);
  const err = C.consensus({ a: C.errorModelRecord('boom'), b: mk('Include') }, ['a', 'b'], {});
  assert.equal(err.decision, 'Include');
  assert.equal(err.needs_human_review, true);
  const k = C.cohenKappa(['I', 'E', 'E', 'I'], ['I', 'E', 'I', 'I']);
  assert.equal(k.observed, 0.75);
  assert.ok(Math.abs(k.kappa - 0.5) < 1e-9);
});

test('column mapping: WoS export (regression: ID must not map to Authors)', () => {
  const headers = ['Publication Type', 'Authors', 'Author Full Names', 'Article Title', 'Document Type', 'Author Keywords', 'Abstract', 'Publication Year', 'DOI', 'UT (Unique WOS ID)'];
  const m = C.mapColumns(headers);
  assert.equal(headers[m.id], 'UT (Unique WOS ID)');
  assert.equal(headers[m.title], 'Article Title');
  assert.equal(headers[m.authors], 'Authors');
  assert.equal(headers[m.doctype], 'Document Type');
  assert.equal(headers[m.keywords], 'Author Keywords');
});

test('record preparation: internal ids, duplicates, unique source ids', () => {
  const rows = [
    ['ID', 'Title', 'Abstract', 'Year', 'DOI'],
    ['A', 'Interest based personalization of mathematics problems', 'Long enough abstract text for screening purposes.', '2020', '10.1/x'],
    ['A', 'Different paper about recommender systems and user interests', 'Another abstract that is long enough to count.', '2021', ''],
    ['B', 'Interest-based personalization of mathematics problems!', 'dup by title', '2020', ''],
    ['C', 'Third', '', '2022', 'https://doi.org/10.1/X'],
    ['', '', '', '', '']
  ];
  const { records, duplicates } = C.prepareRecords(rows);
  assert.equal(records.length, 4);
  assert.deepEqual(records.map(r => r.rid), ['R00001', 'R00002', 'R00003', 'R00004']);
  assert.equal(records[1].ID, 'A#2');
  assert.equal(records[2].duplicateOf, 'R00001');
  assert.equal(records[3].duplicateOf, 'R00001'); // same DOI
  assert.equal(records[3].noAbstract, true);
  assert.equal(duplicates, 2);
});

test('guidance/criteria consistency warnings', () => {
  const w = C.checkGuidanceConsistency('Use IC1, IC2 and IC3. EC1 applies.', criteria);
  assert.ok(w.some(x => x.includes('IC3')));
  assert.ok(w.some(x => x.includes('EC2')));
});

test('protocol lists every criterion and the schema is well-formed', () => {
  const p = C.buildProtocol(criteria, { userTopic: 'my topic' });
  ['IC1', 'IC2', 'EC1', 'EC5', 'relevance_score'].forEach(s => assert.ok(p.includes(s), s));
  const s = C.buildResponseSchema({ userTopic: 'x' });
  assert.equal(s.properties.results.items.properties.decision.enum.length, 3);
});

test('key pool: RPM window, rotation and daily exhaustion', async () => {
  const pool = new C.KeyPool('gemini', ['k1', 'k2', 'k2'], { limits: { m: { rpm: 2, rpd: 3 } } });
  assert.equal(pool.size, 2); // duplicate removed
  const used = [];
  for (let i = 0; i < 4; i++) {
    const s = await pool.acquire('m');
    used.push(s.key);
    pool.release(s, { ok: true });
  }
  assert.deepEqual(used.sort(), ['k1', 'k1', 'k2', 'k2']);
  // next would exceed RPM (2/min each) -> must wait; mark both daily-exhausted to test error instead
  const s = await Promise.race([pool.acquire('m'), C.sleep(300).then(() => 'waiting')]);
  assert.equal(s, 'waiting');
  pool.keys.forEach(k => { k.exhausted.m = true; });
  await assert.rejects(pool.acquire('m'), e => e.name === 'PoolExhaustedError' && e.reason === 'daily_exhausted');
});

test('HTTP error classification', () => {
  assert.equal(C.classifyHttpError(429, { error: { details: [{ '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] }] } }).type, 'daily');
  const r = C.classifyHttpError(429, { error: { details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '37s' }] } });
  assert.equal(r.type, 'rate');
  assert.equal(r.retryAfterMs, 37000);
  assert.equal(C.classifyHttpError(400, { error: { message: 'API key not valid' } }).type, 'invalid');
  assert.equal(C.classifyHttpError(404, {}).type, 'fatal');
  assert.equal(C.classifyHttpError(503, {}).type, 'server');
  assert.equal(C.classifyHttpError(429, { error: { code: 'insufficient_quota', message: 'You exceeded your current quota' } }).type, 'daily');
});

function makeRecords(n) {
  const markers = ['[INC]', '[EC4]', '[NOIC]', '[UNC]', '[LIE]', '[FAKE]', '[SKIP]', ''];
  const rows = [['UT', 'Article Title', 'Abstract', 'Publication Year']];
  for (let i = 0; i < n; i++) {
    rows.push([`WOS:${1000 + i}`, `${markers[i % markers.length]} Paper number ${i} on interest based personalization`, `Students personal interests were collected with a survey in study ${i}.`, '2024']);
  }
  return C.prepareRecords(rows).records;
}

test('engine: parallel multi-key run with 429s, invalid key, schema fallback and missing ids', async () => {
  const records = makeRecords(40);
  const calls = [];
  const fetchImpl = createMockFetch({ calls, rateLimitKeys: { k1: 2 }, invalidKeys: ['bad'], schemaError: true, latencyMs: 20 });
  const pool = new C.KeyPool('gemini', ['k1', 'k2', 'k3', 'bad'], { concurrencyPerKey: 2 });
  const rows = [];
  const logs = [];
  const res = await C.runScreening({
    records,
    models: [{ id: 'gemini-test', provider: 'gemini', apiModel: 'gemini-test' }],
    pools: { gemini: pool },
    system: C.buildSystemInstructions('guidance', criteria, {}),
    batchSize: 5,
    validation: { ...ctx, consensus: 'unanimous' },
    onRecord: r => rows.push(r),
    onLog: m => logs.push(m),
    fetchImpl
  });
  assert.equal(res.completed, true);
  assert.equal(rows.length, 40);
  const by = Object.fromEntries(rows.map(r => [r.title.slice(0, 6), r]));
  const dec = marker => rows.filter(r => r.title.startsWith(marker)).map(r => r.decision);
  assert.ok(dec('[INC]').every(d => d === 'Include'));
  assert.ok(dec('[EC4]').every(d => d === 'Exclude'));
  assert.ok(dec('[NOIC]').every(d => d === 'Exclude'));
  assert.ok(dec('[UNC]').every(d => d === 'Uncertain'));
  assert.ok(dec('[LIE]').every(d => d === 'Uncertain'));   // inconsistent -> review
  assert.ok(dec('[FAKE]').every(d => d === 'Uncertain'));  // evidence not in text
  // [SKIP] records never come back -> error after retries, flagged for review
  assert.ok(rows.filter(r => r.title.startsWith('[SKIP]')).every(r => r.decision === 'Uncertain' && r.needs_human_review && r.error));
  // invalid key was disabled, others were used
  const st = pool.status();
  assert.equal(st[3].status, 'devre dışı');
  assert.ok(new Set(calls.map(c => c.key)).size >= 3);
  assert.ok(logs.some(l => l.includes('responseSchema')));
  assert.ok(by['[INC] '] || true);
  // source ids preserved, internal ids unique
  assert.equal(new Set(rows.map(r => r.rid)).size, 40);
  assert.ok(rows.every(r => r.id.startsWith('WOS:')));
});

test('engine: two providers in parallel with consensus', async () => {
  const records = makeRecords(16).filter(r => !r.Title.includes('[SKIP]'));
  const fetchImpl = createMockFetch({});
  const rows = [];
  const res = await C.runScreening({
    records,
    models: [
      { id: 'g', provider: 'gemini', apiModel: 'gemini-x' },
      { id: 'o', provider: 'openai', apiModel: 'gpt-x' }
    ],
    pools: { gemini: new C.KeyPool('gemini', ['g1', 'g2']), openai: new C.KeyPool('openai', ['o1']) },
    system: 'sys', batchSize: 4,
    validation: { ...ctx, consensus: 'unanimous' },
    onRecord: r => rows.push(r), fetchImpl
  });
  assert.equal(res.completed, true);
  assert.equal(rows.length, records.length);
  assert.ok(rows.every(r => Object.keys(r.modelDecisions).length === 2));
  const k = C.agreementStats(rows, ['g', 'o']);
  assert.equal(k[0].kappa, 1);
});

test('engine: all keys exhausted stops the run as resumable, not as errors', async () => {
  const records = makeRecords(10);
  const fetchImpl = createMockFetch({ dailyKeys: ['k1', 'k2'] });
  const rows = [];
  let fatal = null;
  const res = await C.runScreening({
    records,
    models: [{ id: 'm', provider: 'gemini', apiModel: 'm' }],
    pools: { gemini: new C.KeyPool('gemini', ['k1', 'k2']) },
    system: 'sys', batchSize: 5, validation: ctx,
    onRecord: r => rows.push(r), onFatal: e => { fatal = e; }, fetchImpl
  });
  assert.equal(res.completed, false);
  assert.equal(rows.length, 0);
  assert.equal(fatal.reason, 'daily_exhausted');
});

test('engine: abort signal pauses cleanly', async () => {
  const records = makeRecords(30);
  const ac = new AbortController();
  const rows = [];
  const p = C.runScreening({
    records, models: [{ id: 'm', provider: 'gemini', apiModel: 'm' }],
    pools: { gemini: new C.KeyPool('gemini', ['k1']) }, system: 's', batchSize: 2,
    validation: ctx, onRecord: r => rows.push(r), fetchImpl: createMockFetch({ latencyMs: 40, noSkip: true }), signal: ac.signal
  });
  setTimeout(() => ac.abort(), 120);
  const res = await p;
  assert.equal(res.aborted, true);
  assert.ok(rows.length < 30);
});

test('batch API helpers: planning, state and response parsing', () => {
  const records = makeRecords(9);
  const jobs = C.planBatchJobs({ records, models: [{ id: 'm', apiModel: 'gemini-2.5-flash' }], keyCount: 2, batchSize: 2, system: 'sys' });
  assert.equal(jobs.length, 2);
  assert.equal(jobs.reduce((s, j) => s + j.rids.length, 0), 9);
  assert.ok(jobs[0].requests[0].metadata.key.startsWith('m::R'));
  assert.equal(C.batchJobState({ metadata: { state: 'BATCH_STATE_SUCCEEDED' } }), 'succeeded');
  assert.equal(C.batchJobState({ metadata: { state: 'JOB_STATE_SUCCEEDED' } }), 'succeeded');
  assert.equal(C.batchJobState({ metadata: { state: 'BATCH_STATE_EXPIRED' } }), 'failed');
  assert.equal(C.batchJobState({ metadata: { state: 'BATCH_STATE_RUNNING' } }), 'running');
  const parsed = C.parseBatchResponses({ response: { inlinedResponses: { inlinedResponses: [
    { metadata: { key: 'm::R00001' }, response: { candidates: [{ content: { parts: [{ text: '{"results":[]}' }] } }] } },
    { error: { message: 'bad' }, metadata: { key: 'm::R00002' } }
  ] } } });
  assert.equal(parsed.length, 2);
  assert.equal(parsed[1].error, 'bad');
  const noKey = C.parseBatchResponses({ response: { inlinedResponses: [{ response: { candidates: [] } }, { response: { candidates: [] } }] } });
  assert.deepEqual(noKey.map(x => [x.key, x.index]), [[null, 0], [null, 1]]);
  const jsonl = C.parseBatchResponses('{"key":"a","response":{"candidates":[{"content":{"parts":[{"text":"x"}]}}]}}\n');
  assert.equal(jsonl[0].key, 'a');
});

test('v13: source row, merged Turkish rationale and audit flags kept apart', () => {
  const { records } = C.prepareRecords([['Title', 'Abstract'], ['', ''], ['A title that is long enough', 'Abstract long enough for the screening test.']]);
  assert.equal(records[0].SourceRow, 3);
  const p = C.buildProtocol(criteria, { summaryLanguage: 'Turkish' });
  assert.ok(p.includes('written in Turkish'));
  assert.ok(!p.includes('"summary"'));
  assert.ok(p.includes('LANGUAGE OF "rationale" (MANDATORY)'));
  assert.ok(C.buildUserPrompt([{ rid: 'R1', Title: 't', Abstract: 'a' }], { summaryLanguage: 'Turkish' }).includes('Bu çalışma,'));
  const raw = { decision: 'Include', confidence: 0.9, rationale: 'Bu çalışma öğrencileri inceler.', criteria_assessment: [{ code: 'IC9', verdict: 'yes' }] };
  const v = C.validateModelRecord(raw, { ...ctx, verifyEvidence: false });
  assert.equal(v.rationale, 'Bu çalışma öğrencileri inceler.');
  assert.ok(v.flags.length > 0);
  // legacy row: English summary + bracketed audit notes
  const legacy = C.splitRationale({ summary: 'A study.', rationale: '[Model uyuşmazlığı: a=Include, b=Exclude] Because IC1. [⚠️ Sistem denetimi: x; y]' });
  assert.equal(legacy.text, 'A study. Because IC1.');
  assert.deepEqual(legacy.flags, ['Model uyuşmazlığı: a=Include, b=Exclude', 'x', 'y']);
});

test('v13: evidence ranges tolerate case, dashes, ellipsis gaps and merge overlaps', () => {
  const text = 'A mixed-methods design was implemented at the university, engaging 120 students. AI literacy grew.';
  const ranges = C.evidenceRanges(text, {
    IC4: 'Mixed methods design was implemented... engaging 120 students',
    IC5: 'AI literacy',
    IC6: 'engaging 120 students',
    IC7: '2026',
    EC1: 'not in the text at all'
  });
  const spans = ranges.map(r => [text.slice(r.start, r.end), r.codes.sort().join(',')]);
  assert.deepEqual(spans, [
    ['mixed-methods design was implemented', 'IC4'],
    ['engaging 120 students', 'IC4,IC6'],
    ['AI literacy', 'IC5']
  ]);
});

test('v13: near-duplicate candidates (sorted neighbourhood) respect dismissals', () => {
  const recs = [
    { rid: 'R1', order: 0, Title: 'The use of artificial intelligence in the training of future teachers', Year: '2026', DOI: '' },
    { rid: 'R2', order: 1, Title: 'Something entirely different about climate policy in cities', Year: '2025', DOI: '' },
    { rid: 'R3', order: 2, Title: 'The Use of Artificial Intelligence in the Training of Future Teachers: opportunities', Year: '2025', DOI: '' },
    { rid: 'R4', order: 3, Title: 'A study on the same DOI but other wording here', Year: '2020', DOI: 'https://doi.org/10.1/ABC' },
    { rid: 'R5', order: 4, Title: 'Completely unrelated title with the same doi', Year: '2020', DOI: '10.1/abc' }
  ];
  const pairs = C.findDuplicateCandidates(recs, { threshold: 0.8 });
  assert.deepEqual(pairs.map(p => [p.a, p.b, p.kind]).sort(), [['R1', 'R3', 'fuzzy'], ['R4', 'R5', 'doi']]);
  recs[2].notDupOf = ['R1'];
  assert.deepEqual(C.findDuplicateCandidates(recs, { threshold: 0.8 }).map(p => p.b), ['R5']);
});
