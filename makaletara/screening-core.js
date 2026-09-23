/* ============================================================
 * SCREENING CORE — v13
 * Shared engine for the web UI (script.js) and the Node CLI (cli.mjs).
 *
 *  - Criteria parsing and code normalisation (IC1…, EC1…)
 *  - Auto-generated, criteria-consistent screening protocol + JSON schema
 *  - Three-valued per-criterion assessment (yes / no / unclear) and a
 *    deterministic decision rule (IC logic AND/OR, EC logic OR)
 *  - Evidence verification against the record text (zero-inference guard)
 *  - Multi-model consensus + Cohen's kappa
 *  - Record preparation: internal IDs, de-duplication, missing abstracts
 *  - Multi-key API pools with per-key/per-model RPM & RPD accounting
 *  - Parallel scheduler with retry, batch splitting and key rotation
 *  - Gemini Batch API helpers (request building, job parsing)
 *
 * No DOM access here. Works in browsers (window.ScreeningCore) and in
 * Node >= 18 (module.exports) — both provide fetch/AbortController.
 * ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.ScreeningCore = api;
  else if (root) root.ScreeningCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = '13.0.0';
  const DECISIONS = ['Include', 'Exclude', 'Uncertain'];
  const DECISION_RANK = { Exclude: 0, Uncertain: 1, Include: 2 };

  // ------------------------------------------------------------
  // Small utilities
  // ------------------------------------------------------------
  const sleep = (ms, signal) => new Promise((resolve, reject) => {
    if (signal && signal.aborted) return reject(abortError());
    const t = setTimeout(() => { cleanup(); resolve(); }, Math.max(0, ms));
    const onAbort = () => { clearTimeout(t); cleanup(); reject(abortError()); };
    const cleanup = () => signal && signal.removeEventListener('abort', onAbort);
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
  });

  function abortError() {
    const e = new Error('Aborted');
    e.name = 'AbortError';
    return e;
  }

  function clamp01(x) { return Math.max(0, Math.min(1, x)); }

  // FNV-1a — non-cryptographic fingerprint (used to track key usage without storing keys)
  function fingerprint(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function maskKey(key) {
    if (!key) return '';
    return key.length <= 8 ? '••••' : `${key.slice(0, 4)}…${key.slice(-4)}`;
  }

  // Gemini quotas reset at midnight Pacific time
  function quotaDay(now = Date.now()) {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date(now));
    } catch (e) {
      return new Date(now).toISOString().slice(0, 10);
    }
  }

  function normText(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9ğüşıöç]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ------------------------------------------------------------
  // Criteria
  // ------------------------------------------------------------
  function splitLines(text) {
    return String(text || '')
      .split(/\r?\n/)
      .map(s => s.trim())
      // allow users to paste "IC1: ..." or "- ..." prefixes
      .map(s => s.replace(/^(?:[-*•]\s*)?(?:(?:IC|EC)\s*-?\s*\d+\s*[:.)\-–—]\s*)?/i, '').trim())
      .filter(Boolean);
  }

  function parseCriteria(icText, ecText) {
    return {
      inclusion: splitLines(icText).map((text, i) => ({ code: `IC${i + 1}`, text })),
      exclusion: splitLines(ecText).map((text, i) => ({ code: `EC${i + 1}`, text }))
    };
  }

  // "ic 1", "IC-1", "ic1:", "EC_02" -> "IC1" / "EC2"; anything else -> null
  function normalizeCode(raw) {
    const m = String(raw || '').trim().match(/^(IC|EC)[\s_\-]*0*(\d+)\b/i);
    return m ? `${m[1].toUpperCase()}${parseInt(m[2], 10)}` : null;
  }

  // Detect criteria codes mentioned in free text (e.g. a custom system prompt)
  function codesMentioned(text) {
    const set = new Set();
    const re = /\b(IC|EC)\s?-?(\d{1,2})\b/g;
    let m;
    while ((m = re.exec(String(text || ''))) !== null) set.add(`${m[1]}${parseInt(m[2], 10)}`);
    return set;
  }

  /**
   * Checks whether the review-specific guidance (system prompt) and the
   * criteria lists agree. Returns a list of human-readable warnings (TR).
   */
  function checkGuidanceConsistency(guidance, criteria) {
    const warnings = [];
    const mentioned = codesMentioned(guidance);
    const defined = new Set([...criteria.inclusion, ...criteria.exclusion].map(c => c.code));
    const undefinedRefs = [...mentioned].filter(c => !defined.has(c));
    const unmentioned = [...defined].filter(c => !mentioned.has(c));
    if (!criteria.inclusion.length) warnings.push('Hiç dahil etme ölçütü (IC) tanımlanmamış; model "Include" kararını gerekçelendiremez.');
    if (undefinedRefs.length) {
      warnings.push(`Sistem promptu ${undefinedRefs.join(', ')} kodlarına atıf yapıyor ancak bu kodlar ölçüt listelerinde tanımlı değil. Prompt ile ölçüt listeleri çelişiyor.`);
    }
    if (mentioned.size > 0 && unmentioned.length) {
      warnings.push(`${unmentioned.join(', ')} ölçütleri listede var fakat sistem promptunda hiç geçmiyor; operasyonel tanım eksik olabilir.`);
    }
    return warnings;
  }

  // ------------------------------------------------------------
  // Decision rule (deterministic)
  // ------------------------------------------------------------
  /**
   * @param {Object<string,'yes'|'no'|'unclear'>} assessment
   * @param {{inclusion:Array,exclusion:Array}} criteria
   * @param {'all'|'any'} icLogic
   * @returns {{decision:string, reason:string, failedIC:string[], metEC:string[], unclearEC:string[]}}
   */
  function deriveDecision(assessment, criteria, icLogic = 'all') {
    const icCodes = criteria.inclusion.map(c => c.code);
    const ecCodes = criteria.exclusion.map(c => c.code);
    const v = code => assessment[code] || 'unclear';

    const metEC = ecCodes.filter(c => v(c) === 'yes');
    const unclearEC = ecCodes.filter(c => v(c) === 'unclear');
    const icYes = icCodes.filter(c => v(c) === 'yes');
    const icNo = icCodes.filter(c => v(c) === 'no');

    // Exclusion criteria are disjunctive: any clearly-met EC excludes.
    if (metEC.length) {
      return { decision: 'Exclude', reason: `EC karşılandı: ${metEC.join(', ')}`, failedIC: icNo, metEC, unclearEC };
    }

    let icStatus; // 'met' | 'failed' | 'unclear'
    if (!icCodes.length) icStatus = 'unclear';
    else if (icLogic === 'any') {
      icStatus = icYes.length ? 'met' : (icNo.length === icCodes.length ? 'failed' : 'unclear');
    } else {
      icStatus = icNo.length ? 'failed' : (icYes.length === icCodes.length ? 'met' : 'unclear');
    }

    if (icStatus === 'failed') {
      const failed = icLogic === 'any' ? icCodes : icNo;
      return { decision: 'Exclude', reason: `IC karşılanmadı: ${failed.join(', ')}`, failedIC: failed, metEC, unclearEC };
    }
    if (icStatus === 'met') {
      // Include requires NOT(any EC). An EC that cannot be ruled out keeps the record Uncertain.
      if (unclearEC.length) {
        return { decision: 'Uncertain', reason: `IC karşılandı ancak ${unclearEC.join(', ')} dışlanamadı`, failedIC: [], metEC, unclearEC };
      }
      return { decision: 'Include', reason: 'Tüm gerekli IC karşılandı, hiçbir EC karşılanmadı', failedIC: [], metEC, unclearEC };
    }
    const unclearIC = icCodes.filter(c => v(c) === 'unclear');
    return { decision: 'Uncertain', reason: `Belirsiz IC: ${unclearIC.join(', ') || '-'}`, failedIC: icNo, metEC, unclearEC };
  }

  // ------------------------------------------------------------
  // Prompt construction
  // ------------------------------------------------------------
  const DEFAULT_OPTIONS = {
    icLogic: 'all',               // 'all' (AND) | 'any' (OR)
    reviewThreshold: 0.85,        // confidence below this -> human review
    summaryLanguage: 'Turkish',
    requireEvidence: true,
    verifyEvidence: true,
    consensus: 'unanimous',       // 'unanimous' | 'majority' | 'any_include'
    userTopic: ''
  };

  function buildProtocol(criteria, opts = {}) {
    const o = Object.assign({}, DEFAULT_OPTIONS, opts);
    const ic = criteria.inclusion;
    const ec = criteria.exclusion;
    const icRule = o.icLogic === 'any'
      ? `AT LEAST ONE of (${ic.map(c => c.code).join(' OR ') || '—'}) is "yes"`
      : `ALL of (${ic.map(c => c.code).join(' AND ') || '—'}) are "yes"`;

    let p = '';
    p += '==================================================\n';
    p += 'AUTHORITATIVE SCREENING PROTOCOL (system-generated)\n';
    p += '==================================================\n';
    p += 'The criteria below are the official, current criteria. If any earlier text defines a different output format or different criteria codes, THIS protocol takes precedence.\n\n';

    p += 'INCLUSION CRITERIA (IC):\n';
    ic.forEach(c => { p += `- ${c.code}: ${c.text}\n`; });
    if (!ic.length) p += '- (none defined)\n';
    p += '\nEXCLUSION CRITERIA (EC):\n';
    ec.forEach(c => { p += `- ${c.code}: ${c.text}\n`; });
    if (!ec.length) p += '- (none defined)\n';

    p += `
STEP A — ASSESS EVERY CRITERION SEPARATELY
For EACH record and EACH criterion code listed above, give exactly one verdict:
- "yes": the title/abstract/metadata EXPLICITLY shows the criterion is met.
- "no": the title/abstract/metadata EXPLICITLY shows the criterion is NOT met.
- "unclear": the available text is insufficient. Missing information is NOT evidence of absence.
For an exclusion criterion, "yes" means the exclusion condition applies (the record should be excluded for this reason).
${o.requireEvidence ? 'For every "yes" and every "no" verdict, copy a SHORT VERBATIM quote (max 25 words) from the title or abstract as "evidence". Copy ONE contiguous passage exactly as written (same words, same order): never paraphrase and never join separate passages with "...". Use "" for "unclear".\n' : ''}
STEP B — APPLY THE DECISION RULE (it is deterministic; your decision must follow it)
1. If ANY EC is "yes" -> "Exclude".
2. Else, if the inclusion requirement fails (${o.icLogic === 'any' ? 'ALL IC are "no"' : 'ANY IC is "no"'}) -> "Exclude".
3. Else, if ${icRule} AND every EC is "no" -> "Include".
4. Otherwise -> "Uncertain" (e.g. an IC is "unclear", or an EC cannot be ruled out).

STEP C — CONFIDENCE AND HUMAN REVIEW
- "confidence" (0.00–1.00) is your confidence in the screening decision, not in the study's quality.
- Set "needs_human_review": true when decision is "Uncertain", when confidence < ${o.reviewThreshold.toFixed(2)}, or when a construct is genuinely ambiguous.

OUTPUT FORMAT
Return ONLY valid JSON (no markdown, no code fences, no prose outside JSON) with this structure:
{"results": [
  {
    "id": "<the record id exactly as given, e.g. R00001>",
    "criteria_assessment": [
${[...ic, ...ec].map(c => `      {"code": "${c.code}", "verdict": "yes|no|unclear", "evidence": "<verbatim quote or empty>"}`).join(',\n')}
    ],
    "decision": "Include|Exclude|Uncertain",
    "confidence": 0.00,
    "needs_human_review": true,
    "rationale": "<2–3 sentences written in ${o.summaryLanguage}: first what the study examines (population/setting, focus, design), then why the decision follows, citing criterion codes such as IC1 or EC2>"${o.userTopic ? ',\n    "relevance_score": 0.00,\n    "relevance_rationale": "<why the record is (not) close to the user\'s research topic>"' : ''}
  }
]}
Return exactly one result object per input record, in input order, and do NOT repeat title, abstract, authors or year.
`;

    if (o.userTopic) {
      p += `
==================================================
USER'S OWN RESEARCH TOPIC (for relevance scoring only)
==================================================
${o.userTopic}

"relevance_score" (0.0–1.0) rates how closely the record's CORE focus (aim, method, main contribution) matches this topic — not incidental keyword overlap:
0.8–1.0 core focus overlaps directly; 0.5–0.7 a substantial part or the method is directly relevant; 0.1–0.4 only indirect/background relevance; 0.0 unrelated.
The relevance score is informational and MUST NOT change the criteria-based decision.
`;
    }
    return p;
  }

  function buildSystemInstructions(guidance, criteria, opts = {}) {
    const g = String(guidance || '').trim();
    const protocol = buildProtocol(criteria, opts);
    return g ? `${g}\n\n${protocol}` : protocol;
  }

  /**
   * Records are presented with short internal IDs (R00001…) that models
   * reproduce reliably; the source ID (e.g. WoS UT) is kept locally.
   * Authors are intentionally NOT sent (blinded screening, fewer tokens).
   */
  function buildUserPrompt(records) {
    let p = `Screen the following ${records.length} record(s). Return {"results": [...]} with one object per record.\n\n`;
    records.forEach(r => {
      p += `<record id="${r.rid}">\n`;
      p += `TITLE: ${r.Title || '[not available]'}\n`;
      if (r.Year) p += `YEAR: ${r.Year}\n`;
      if (r.DocType) p += `PUBLICATION TYPE: ${r.DocType}\n`;
      if (r.Keywords) p += `KEYWORDS: ${r.Keywords}\n`;
      p += `ABSTRACT: ${r.Abstract || '[no abstract available — judge only from the fields above; do not treat missing information as evidence]'}\n`;
      p += `</record>\n\n`;
    });
    return p;
  }

  // Gemini responseSchema (OpenAPI subset)
  function buildResponseSchema(opts = {}) {
    const item = {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING' },
        criteria_assessment: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              code: { type: 'STRING' },
              verdict: { type: 'STRING', enum: ['yes', 'no', 'unclear'] },
              evidence: { type: 'STRING' }
            },
            required: ['code', 'verdict']
          }
        },
        decision: { type: 'STRING', enum: DECISIONS },
        confidence: { type: 'NUMBER' },
        needs_human_review: { type: 'BOOLEAN' },
        rationale: { type: 'STRING' }
      },
      required: ['id', 'criteria_assessment', 'decision', 'confidence', 'needs_human_review', 'rationale'],
      propertyOrdering: ['id', 'criteria_assessment', 'decision', 'confidence', 'needs_human_review', 'rationale']
    };
    if (opts.userTopic) {
      item.properties.relevance_score = { type: 'NUMBER' };
      item.properties.relevance_rationale = { type: 'STRING' };
      item.propertyOrdering.push('relevance_score', 'relevance_rationale');
    }
    return {
      type: 'OBJECT',
      properties: { results: { type: 'ARRAY', items: item } },
      required: ['results']
    };
  }

  // ------------------------------------------------------------
  // Response parsing
  // ------------------------------------------------------------
  function extractArray(parsed) {
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
      for (const k of ['results', 'records', 'items', 'data']) {
        if (Array.isArray(parsed[k])) return parsed[k];
      }
      if (parsed.id !== undefined || parsed.decision !== undefined) return [parsed];
    }
    return null;
  }

  function parseModelResponse(text) {
    const cleaned = String(text || '').replace(/```(?:json)?/gi, '').trim();
    const attempts = [cleaned];
    const fb = cleaned.indexOf('{'), lb = cleaned.lastIndexOf('}');
    const fa = cleaned.indexOf('['), la = cleaned.lastIndexOf(']');
    if (fb !== -1 && lb > fb) attempts.push(cleaned.slice(fb, lb + 1));
    if (fa !== -1 && la > fa) attempts.push(cleaned.slice(fa, la + 1));
    for (const a of attempts) {
      try {
        const arr = extractArray(JSON.parse(a));
        if (arr) return arr.filter(x => x && typeof x === 'object');
      } catch (e) { /* try next */ }
    }
    return [];
  }

  function normalizeDecision(d) {
    const s = String(d || '').trim().toLowerCase();
    if (/^incl|^dahil/.test(s)) return 'Include';
    if (/^excl|^hari[çc]/.test(s)) return 'Exclude';
    if (/^(uncert|unclear|maybe|belirsiz)/.test(s)) return 'Uncertain';
    return null;
  }

  function normalizeVerdict(v) {
    if (v === true) return 'yes';
    if (v === false) return 'no';
    const s = String(v || '').trim().toLowerCase();
    if (/^(yes|y|met|satisfied|true|evet|applies|karşılandı)/.test(s)) return 'yes';
    if (/^(no|n|not|false|hayır|hayir|unmet|does not)/.test(s)) return 'no';
    return 'unclear';
  }

  function parseConfidence(c) {
    let x = typeof c === 'string' ? parseFloat(c.replace('%', '')) : c;
    if (typeof x !== 'number' || !isFinite(x)) return null;
    if (x > 1 && x <= 100) x = x / 100;
    return clamp01(x);
  }

  // Share of meaningful quote tokens present in the record text
  function evidenceSupported(quote, recordText) {
    const q = normText(quote).split(' ').filter(t => t.length > 2);
    if (!q.length) return true; // nothing to verify
    const hay = ' ' + normText(recordText) + ' ';
    if (hay.includes(' ' + q.join(' ') + ' ')) return true;
    const hits = q.filter(t => hay.includes(' ' + t + ' ')).length;
    return hits / q.length >= 0.8;
  }

  /**
   * Validates one model's output for one record and applies the
   * deterministic decision rule.
   * ctx: { criteria, icLogic, reviewThreshold, userTopic, verifyEvidence, recordText }
   */
  function validateModelRecord(raw, ctx) {
    const criteria = ctx.criteria;
    const allCodes = [...criteria.inclusion, ...criteria.exclusion].map(c => c.code);
    const threshold = typeof ctx.reviewThreshold === 'number' ? ctx.reviewThreshold : DEFAULT_OPTIONS.reviewThreshold;
    const flags = [];

    const modelDecision = normalizeDecision(raw.decision);
    if (!modelDecision) flags.push(`geçersiz karar değeri: "${raw.decision}"`);
    const confidence = parseConfidence(raw.confidence);
    if (confidence === null) flags.push('güven değeri yok');

    // ---- per-criterion assessment
    const assessment = {};
    const evidence = {};
    let ca = raw.criteria_assessment;
    if (ca && !Array.isArray(ca) && typeof ca === 'object') {
      ca = Object.entries(ca).map(([code, v]) => (typeof v === 'object' && v !== null)
        ? Object.assign({ code }, v) : { code, verdict: v });
    }
    const hasAssessment = Array.isArray(ca) && ca.length > 0;
    const unknownCodes = [];
    if (hasAssessment) {
      ca.forEach(item => {
        const code = normalizeCode(item.code || item.criterion);
        if (!code || !allCodes.includes(code)) { unknownCodes.push(item.code); return; }
        assessment[code] = normalizeVerdict(item.verdict !== undefined ? item.verdict : item.met);
        if (item.evidence) evidence[code] = String(item.evidence);
      });
    }
    if (unknownCodes.length) flags.push(`tanımsız ölçüt kodu: ${unknownCodes.join(', ')}`);

    // Legacy output (matched_* lists only)
    const legacyIC = (raw.matched_inclusion_criteria || []).map(normalizeCode).filter(c => c && allCodes.includes(c));
    const legacyEC = (raw.matched_exclusion_criteria || []).map(normalizeCode).filter(c => c && allCodes.includes(c));

    let derived;
    if (hasAssessment) {
      const missing = allCodes.filter(c => !(c in assessment));
      if (missing.length) flags.push(`değerlendirilmemiş ölçüt: ${missing.join(', ')}`);
      // Evidence check — a "yes" that cannot be found in the record is downgraded to "unclear"
      if (ctx.verifyEvidence !== false && ctx.recordText) {
        Object.keys(assessment).forEach(code => {
          if (assessment[code] === 'yes' && evidence[code] && !evidenceSupported(evidence[code], ctx.recordText)) {
            flags.push(`${code} kanıtı kayıt metninde bulunamadı`);
            assessment[code] = 'unclear';
          }
        });
      }
      derived = deriveDecision(assessment, criteria, ctx.icLogic);
    } else {
      flags.push('ölçüt bazlı değerlendirme yok (eski format)');
      legacyIC.forEach(c => { assessment[c] = 'yes'; });
      legacyEC.forEach(c => { assessment[c] = 'yes'; });
      derived = deriveDecision(assessment, criteria, ctx.icLogic);
      // Without per-criterion evidence we cannot distinguish "no" from "unclear":
      // accept the model's Exclude only if it cites an EC; otherwise keep the more inclusive outcome.
    }

    let decision = derived.decision;
    let inconsistent = false;
    if (modelDecision && modelDecision !== derived.decision) {
      inconsistent = true;
      // Contradiction between the model's decision and its own criterion verdicts:
      // never auto-include or auto-exclude — route to a human.
      decision = 'Uncertain';
      flags.push(`tutarsızlık: model "${modelDecision}" dedi, ölçüt kuralı "${derived.decision}" gerektiriyor`);
    }

    const matchedIC = criteria.inclusion.map(c => c.code).filter(c => assessment[c] === 'yes');
    const matchedEC = criteria.exclusion.map(c => c.code).filter(c => assessment[c] === 'yes');

    const rationale = String(raw.rationale || '').trim();

    const needsReview = raw.needs_human_review === true
      || decision === 'Uncertain'
      || confidence === null || confidence < threshold
      || inconsistent
      || flags.length > 0;

    let relevance = null;
    if (ctx.userTopic) {
      const r = parseConfidence(raw.relevance_score);
      relevance = r === null ? null : r;
    }

    return {
      decision,
      model_decision: modelDecision || 'Uncertain',
      rule_decision: derived.decision,
      rule_reason: derived.reason,
      confidence: confidence === null ? 0 : confidence,
      assessment,
      evidence,
      matched_inclusion_criteria: matchedIC,
      matched_exclusion_criteria: matchedEC,
      exclusion_reason: decision === 'Exclude' ? derived.reason : '',
      needs_human_review: needsReview,
      inconsistent,
      flags,
      summary: String(raw.summary || raw.summary_tr || '').trim(),
      rationale,
      relevance_score: relevance,
      relevance_rationale: ctx.userTopic ? String(raw.relevance_rationale || '').trim() : '',
      error: null
    };
  }

  function errorModelRecord(message) {
    return {
      decision: 'Uncertain', model_decision: 'Uncertain', rule_decision: 'Uncertain', rule_reason: '',
      confidence: 0, assessment: {}, evidence: {},
      matched_inclusion_criteria: [], matched_exclusion_criteria: [], exclusion_reason: '',
      needs_human_review: true, inconsistent: false, flags: [],
      summary: '', rationale: `Model hatası: ${message}`,
      relevance_score: null, relevance_rationale: '', error: String(message)
    };
  }

  // ------------------------------------------------------------
  // Consensus across models
  // ------------------------------------------------------------
  function consensus(modelResults, modelOrder, opts = {}) {
    const strategy = opts.consensus || DEFAULT_OPTIONS.consensus;
    const threshold = typeof opts.reviewThreshold === 'number' ? opts.reviewThreshold : DEFAULT_OPTIONS.reviewThreshold;
    const order = modelOrder.filter(m => modelResults[m]);
    const valid = order.filter(m => !modelResults[m].error);
    const errored = order.filter(m => modelResults[m].error);

    if (!valid.length) {
      const first = modelResults[order[0]] || errorModelRecord('yanıt yok');
      return Object.assign({}, first, {
        decision: 'Uncertain', needs_human_review: true, agreement: 'error', error: first.error || 'yanıt yok'
      });
    }

    const decisions = valid.map(m => modelResults[m].decision);
    const counts = decisions.reduce((a, d) => (a[d] = (a[d] || 0) + 1, a), {});
    const unique = Object.keys(counts);
    let decision;
    if (unique.length === 1) decision = unique[0];
    else if (strategy === 'majority') {
      const [top, topN] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      decision = topN > valid.length / 2 ? top : 'Uncertain';
    } else if (strategy === 'any_include') {
      decision = counts.Include ? 'Include' : 'Uncertain';
    } else {
      decision = 'Uncertain';
    }

    const agreeing = valid.filter(m => modelResults[m].decision === decision);
    const pool = agreeing.length ? agreeing : valid;
    const primary = modelResults[pool[0]];
    const confidence = Math.min(...pool.map(m => modelResults[m].confidence));
    const rels = valid.map(m => modelResults[m].relevance_score).filter(x => typeof x === 'number');

    const unanimous = unique.length === 1 && errored.length === 0;
    const needsReview = !unanimous
      || decision === 'Uncertain'
      || confidence < threshold
      || valid.some(m => modelResults[m].needs_human_review);

    const flags = [...(primary.flags || [])];
    if (unique.length > 1) flags.unshift(`model uyuşmazlığı: ${valid.map(m => `${m}=${modelResults[m].decision}`).join(', ')}`);
    if (errored.length) flags.push(`hata veren model(ler): ${errored.join(', ')}`);

    return Object.assign({}, primary, {
      decision,
      confidence,
      needs_human_review: needsReview,
      agreement: unanimous ? 'unanimous' : (errored.length && unique.length === 1 ? 'partial' : 'split'),
      exclusion_reason: decision === 'Exclude' ? primary.exclusion_reason : '',
      flags,
      relevance_score: rels.length ? rels.reduce((a, b) => a + b, 0) / rels.length : null,
      error: null
    });
  }

  // Cohen's kappa for two raters over the same items
  function cohenKappa(a, b) {
    const n = Math.min(a.length, b.length);
    if (!n) return null;
    const cats = [...new Set([...a.slice(0, n), ...b.slice(0, n)])];
    let agree = 0;
    const pa = {}, pb = {};
    for (let i = 0; i < n; i++) {
      if (a[i] === b[i]) agree++;
      pa[a[i]] = (pa[a[i]] || 0) + 1;
      pb[b[i]] = (pb[b[i]] || 0) + 1;
    }
    const po = agree / n;
    const pe = cats.reduce((s, c) => s + ((pa[c] || 0) / n) * ((pb[c] || 0) / n), 0);
    const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe);
    return { n, observed: po, expected: pe, kappa };
  }

  function agreementStats(results, models) {
    const pairs = [];
    for (let i = 0; i < models.length; i++) {
      for (let j = i + 1; j < models.length; j++) {
        const a = [], b = [];
        results.forEach(r => {
          const x = r.modelDecisions && r.modelDecisions[models[i]];
          const y = r.modelDecisions && r.modelDecisions[models[j]];
          if (x && y && !x.error && !y.error) { a.push(x.decision); b.push(y.decision); }
        });
        const k = cohenKappa(a, b);
        if (k) pairs.push(Object.assign({ a: models[i], b: models[j] }, k));
      }
    }
    return pairs;
  }

  // ------------------------------------------------------------
  // Record preparation
  // ------------------------------------------------------------
  const COLUMN_ALIASES = {
    id: ['ut (unique wos id)', 'ut', 'unique wos id', 'accession number', 'eid', 'id', 'record id', 'pmid', 'pubmed id', 'artno', 'sıra no', 'sira no', 'no'],
    title: ['article title', 'title', 'ti', 'document title', 'paper title', 'başlık', 'baslik', 'makale adı', 'makale adi', 'primary title'],
    abstract: ['abstract', 'ab', 'özet', 'ozet', 'abstract text', 'özet metin', 'summary'],
    authors: ['authors', 'author', 'au', 'author full names', 'yazar', 'yazarlar', 'author(s)', 'yazar(lar)', 'creator'],
    year: ['publication year', 'year', 'py', 'yıl', 'yil', 'yayın yılı', 'yayin yili', 'pubyear'],
    doi: ['doi', 'di', 'digital object identifier'],
    keywords: ['author keywords', 'keywords', 'de', 'kw', 'anahtar kelimeler', 'index keywords'],
    doctype: ['document type', 'dt', 'publication type', 'type', 'belge türü']
  };

  const normHeader = s => String(s || '').toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i').replace(/[^a-z0-9]/g, '');

  /**
   * Maps a column role to a header index. Exact (normalised) match first, in
   * alias-priority order; then a conservative "starts with" match for
   * aliases of length >= 4. Never matches short aliases by substring
   * (previous bug: "ut" matched "Authors").
   */
  function findColumn(headers, aliases) {
    const nh = headers.map(normHeader);
    for (const alias of aliases) {
      const i = nh.indexOf(normHeader(alias));
      if (i !== -1) return i;
    }
    for (const alias of aliases) {
      const na = normHeader(alias);
      if (na.length < 4) continue;
      const i = nh.findIndex(h => h.startsWith(na));
      if (i !== -1) return i;
    }
    return -1;
  }

  function mapColumns(headers) {
    const map = {};
    Object.keys(COLUMN_ALIASES).forEach(role => { map[role] = findColumn(headers, COLUMN_ALIASES[role]); });
    // WoS: "Publication Type" is J/B/S/P (not the document type) — prefer "Document Type"
    const dt = findColumn(headers, ['document type', 'dt']);
    if (dt !== -1) map.doctype = dt;
    return map;
  }

  function normalizeDoi(d) {
    return String(d || '').toLowerCase().trim()
      .replace(/^https?:\/\/(dx\.)?doi\.org\//, '').replace(/^doi:\s*/, '');
  }

  /**
   * rows: array of arrays (first row = headers) OR array of objects.
   * Returns { records, columns, duplicates }.
   */
  function prepareRecords(rows, opts = {}) {
    let headers, body;
    if (!rows.length) return { records: [], columns: {}, duplicates: 0 };
    if (Array.isArray(rows[0])) { headers = rows[0].map(String); body = rows.slice(1); }
    else { headers = Object.keys(rows[0]); body = rows.map(r => headers.map(h => r[h])); }
    // body[i] is spreadsheet row i + 2 (row 1 = header)

    const col = mapColumns(headers);
    if (col.title === -1 && col.abstract === -1) {
      const err = new Error(`Başlık (Title) ve Özet (Abstract) sütunları algılanamadı. Algılanan sütunlar: ${headers.slice(0, 12).join(', ')}`);
      err.code = 'NO_COLUMNS';
      throw err;
    }
    const get = (v, i) => (i === -1 || v[i] === undefined || v[i] === null) ? '' : String(v[i]).trim();

    const records = [];
    const seenTitle = new Map();
    const seenDoi = new Map();
    const seenId = new Map();
    let duplicates = 0;
    body.forEach((v, i) => {
      const r = {
        rid: '',
        order: records.length,
        ID: get(v, col.id),
        Title: get(v, col.title),
        Abstract: get(v, col.abstract),
        Authors: get(v, col.authors),
        Year: get(v, col.year).replace(/\.0$/, ''),
        DOI: get(v, col.doi),
        Keywords: get(v, col.keywords),
        DocType: get(v, col.doctype),
        SourceRow: i + 2,
        duplicateOf: '',
        noAbstract: false
      };
      if (!r.Title && !r.Abstract) return;
      r.rid = `R${String(records.length + 1).padStart(5, '0')}`;
      if (!r.ID) r.ID = String(i + 1);
      // Source IDs must be unique for exports
      if (seenId.has(r.ID)) { seenId.set(r.ID, seenId.get(r.ID) + 1); r.ID = `${r.ID}#${seenId.get(r.ID)}`; }
      else seenId.set(r.ID, 1);
      r.noAbstract = r.Abstract.length < (opts.minAbstractLength || 30);

      if (opts.dedupe !== false) {
        const doi = normalizeDoi(r.DOI);
        const tkey = normText(r.Title);
        const titleKey = tkey.length >= 20 ? `${tkey}|${r.Year}` : '';
        const dup = (doi && seenDoi.get(doi)) || (titleKey && seenTitle.get(titleKey));
        if (dup) { r.duplicateOf = dup; r.dupKind = doi && seenDoi.get(doi) ? 'doi' : 'title'; duplicates++; }
        else {
          if (doi) seenDoi.set(doi, r.rid);
          if (titleKey) seenTitle.set(titleKey, r.rid);
        }
      }
      records.push(r);
    });
    return { records, columns: Object.fromEntries(Object.entries(col).map(([k, i]) => [k, i === -1 ? null : headers[i]])), duplicates };
  }

  function recordText(r) {
    return [r.Title, r.Abstract, r.Keywords, r.DocType, r.Year].filter(Boolean).join(' \n ');
  }

  // Builds a final result row for records that are not sent to a model
  function presetResult(record, decision, reason) {
    return {
      rid: record.rid, order: record.order, id: record.ID, authors: record.Authors, title: record.Title,
      year: record.Year, doi: record.DOI, abstract: record.Abstract, source_row: record.SourceRow || null,
      decision, ai_decision: decision, human_decision: '', confidence: null,
      matched_inclusion_criteria: [], matched_exclusion_criteria: [], assessment: {}, evidence: {},
      exclusion_reason: decision === 'Duplicate' ? `Tekrar kaydı (${record.duplicateOf})` : '',
      needs_human_review: decision === 'Uncertain', agreement: 'n/a', summary: '',
      rationale: reason, flags: [], relevance_score: null, relevance_rationale: '', modelDecisions: {}, error: null,
      preset: true
    };
  }

  function finalizeRecord(record, modelResults, modelOrder, opts) {
    const c = consensus(modelResults, modelOrder, opts);
    return {
      rid: record.rid, order: record.order, id: record.ID, authors: record.Authors, title: record.Title,
      year: record.Year, doi: record.DOI, abstract: record.Abstract, source_row: record.SourceRow || null,
      decision: c.decision, ai_decision: c.decision, human_decision: '',
      confidence: c.confidence,
      matched_inclusion_criteria: c.matched_inclusion_criteria,
      matched_exclusion_criteria: c.matched_exclusion_criteria,
      assessment: c.assessment, evidence: c.evidence,
      exclusion_reason: c.exclusion_reason,
      needs_human_review: c.needs_human_review,
      agreement: c.agreement,
      summary: c.summary, rationale: c.rationale, flags: c.flags || [],
      relevance_score: c.relevance_score, relevance_rationale: c.relevance_rationale,
      modelDecisions: modelResults,
      error: c.error || null
    };
  }

  // ------------------------------------------------------------
  // API key pools
  // ------------------------------------------------------------
  class PoolExhaustedError extends Error {
    constructor(message, reason) { super(message); this.name = 'PoolExhaustedError'; this.reason = reason; }
  }

  /**
   * One pool per provider. Each key tracks, per model: request timestamps in
   * the last 60 s (RPM), requests today (RPD, Pacific day), cooldown and
   * daily exhaustion. Keys that return auth errors are disabled.
   */
  class KeyPool {
    constructor(provider, keys, opts = {}) {
      this.provider = provider;
      this.opts = Object.assign({ concurrencyPerKey: 1, minIntervalMs: 0, limits: {} }, opts);
      const seen = new Set();
      this.keys = (keys || [])
        .map(k => (typeof k === 'string' ? { key: k } : k))
        .map(k => Object.assign({}, k, { key: String(k.key || '').trim() }))
        .filter(k => k.key && !seen.has(k.key) && seen.add(k.key))
        .map((k, i) => ({
          key: k.key,
          label: k.label || `${provider}#${i + 1} (${maskKey(k.key)})`,
          fp: fingerprint(k.key),
          disabled: false, disabledReason: '',
          inflight: 0, lastStart: 0,
          window: {}, dailyUsed: {}, day: quotaDay(), exhausted: {},
          cooldownUntil: 0,
          stats: { requests: 0, ok: 0, rateLimited: 0, errors: 0 }
        }));
      this.listeners = new Set();
    }

    get size() { return this.keys.length; }
    get capacity() { return this.keys.length * Math.max(1, this.opts.concurrencyPerKey); }

    limitsFor(model) {
      return Object.assign({ rpm: 0, rpd: 0 }, this.opts.limits[model] || this.opts.limits['*'] || {});
    }

    onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    emit() { this.listeners.forEach(fn => { try { fn(this.status()); } catch (e) { /* ignore */ } }); }

    rollDay(k) {
      const d = quotaDay();
      if (k.day !== d) { k.day = d; k.dailyUsed = {}; k.exhausted = {}; }
    }

    /** Imports persisted daily usage: { fp: { day, used: {model:n}, exhausted: {model:true} } } */
    importUsage(usage) {
      if (!usage) return;
      this.keys.forEach(k => {
        const u = usage[k.fp];
        if (u && u.day === quotaDay()) {
          k.day = u.day;
          k.dailyUsed = Object.assign({}, u.used || {});
          k.exhausted = Object.assign({}, u.exhausted || {});
        }
      });
    }

    exportUsage() {
      const out = {};
      this.keys.forEach(k => { out[k.fp] = { day: k.day, used: k.dailyUsed, exhausted: k.exhausted }; });
      return out;
    }

    /** Earliest time (ms) key k can start a request for model, or Infinity. */
    readyAt(k, model, now) {
      this.rollDay(k);
      if (k.disabled || k.exhausted[model]) return Infinity;
      const { rpm, rpd } = this.limitsFor(model);
      if (rpd > 0 && (k.dailyUsed[model] || 0) >= rpd) return Infinity;
      if (k.inflight >= Math.max(1, this.opts.concurrencyPerKey)) return now + 50;
      let t = Math.max(now, k.cooldownUntil);
      if (this.opts.minIntervalMs) t = Math.max(t, k.lastStart + this.opts.minIntervalMs);
      if (rpm > 0) {
        const w = (k.window[model] || []).filter(ts => ts > now - 60000);
        k.window[model] = w;
        if (w.length >= rpm) t = Math.max(t, w[0] + 60000 + 25);
      }
      return t;
    }

    usable(model) {
      return this.keys.some(k => { this.rollDay(k); return !k.disabled && !k.exhausted[model]; });
    }

    async acquire(model, signal) {
      if (!this.keys.length) throw new PoolExhaustedError(`${this.provider} için API anahtarı tanımlı değil.`, 'no_keys');
      for (;;) {
        if (signal && signal.aborted) throw abortError();
        const now = Date.now();
        let best = null, bestT = Infinity;
        for (const k of this.keys) {
          const t = this.readyAt(k, model, now);
          if (t < bestT || (t === bestT && best && k.lastStart < best.lastStart)) { best = k; bestT = t; }
        }
        if (!best || bestT === Infinity) {
          const allDisabled = this.keys.every(k => k.disabled);
          throw new PoolExhaustedError(
            allDisabled
              ? `${this.provider}: tüm API anahtarları geçersiz/devre dışı.`
              : `${this.provider}: tüm anahtarların ${model} için günlük kotası doldu. Pasifik saatiyle gece yarısından sonra "Devam Et" ile sürdürebilirsiniz.`,
            allDisabled ? 'all_disabled' : 'daily_exhausted');
        }
        if (bestT <= now) {
          best.inflight++;
          best.lastStart = now;
          (best.window[model] = best.window[model] || []).push(now);
          best.dailyUsed[model] = (best.dailyUsed[model] || 0) + 1;
          best.stats.requests++;
          this.emit();
          return { k: best, key: best.key, label: best.label, model };
        }
        await sleep(Math.min(bestT - now, 1000), signal);
      }
    }

    /** outcome: { ok } | { type:'rate'|'daily'|'invalid'|'server'|'network'|'bad_request'|'fatal', retryAfterMs } */
    release(slot, outcome = { ok: true }) {
      const k = slot.k;
      k.inflight = Math.max(0, k.inflight - 1);
      if (outcome.type === 'abort') { this.emit(); return; }
      if (outcome.ok) k.stats.ok++;
      else if (outcome.type === 'rate') {
        k.stats.rateLimited++;
        k.cooldownUntil = Date.now() + Math.max(outcome.retryAfterMs || 0, 5000);
      } else if (outcome.type === 'daily') {
        k.stats.rateLimited++;
        k.exhausted[slot.model] = true;
      } else if (outcome.type === 'invalid') {
        k.stats.errors++;
        k.disabled = true;
        k.disabledReason = outcome.message || 'geçersiz anahtar';
      } else {
        k.stats.errors++;
        if (outcome.type === 'server' || outcome.type === 'network') {
          k.cooldownUntil = Date.now() + (outcome.retryAfterMs || 3000);
        }
      }
      this.emit();
    }

    status() {
      const now = Date.now();
      return this.keys.map(k => {
        this.rollDay(k);
        let st = 'hazır';
        if (k.disabled) st = 'devre dışı';
        else if (Object.keys(k.exhausted).length) st = 'günlük kota doldu';
        else if (k.cooldownUntil > now) st = `beklemede (${Math.ceil((k.cooldownUntil - now) / 1000)} sn)`;
        else if (k.inflight > 0) st = 'çalışıyor';
        return {
          provider: this.provider, label: k.label, fp: k.fp, status: st,
          disabledReason: k.disabledReason, inflight: k.inflight,
          dailyUsed: Object.assign({}, k.dailyUsed), exhausted: Object.keys(k.exhausted),
          stats: Object.assign({}, k.stats)
        };
      });
    }
  }

  // ------------------------------------------------------------
  // Provider calls
  // ------------------------------------------------------------
  class ApiError extends Error {
    constructor(message, info) { super(message); this.name = 'ApiError'; Object.assign(this, info); }
  }

  function parseDurationMs(s) {
    if (!s) return 0;
    const m = String(s).match(/([\d.]+)\s*s/);
    return m ? Math.ceil(parseFloat(m[1]) * 1000) : 0;
  }

  /** Classifies an HTTP error into a retry strategy. */
  function classifyHttpError(status, body, headers) {
    const err = (body && body.error) || {};
    const msg = err.message || (typeof body === 'string' ? body : '') || `HTTP ${status}`;
    const details = Array.isArray(err.details) ? err.details : [];
    const retryInfo = details.find(d => /RetryInfo/.test(d['@type'] || ''));
    const quota = details.find(d => /QuotaFailure/.test(d['@type'] || ''));
    const reasons = details.map(d => d.reason).filter(Boolean).join(' ');
    let retryAfterMs = retryInfo ? parseDurationMs(retryInfo.retryDelay) : 0;
    const ra = headers && (typeof headers.get === 'function' ? headers.get('retry-after') : headers['retry-after']);
    if (!retryAfterMs && ra && isFinite(parseFloat(ra))) retryAfterMs = parseFloat(ra) * 1000;

    if (status === 429) {
      const quotaIds = quota ? (quota.violations || []).map(v => v.quotaId || v.quotaMetric || '').join(' ') : '';
      if (/PerDay|per_day|daily/i.test(quotaIds) || /insufficient_quota|billing/i.test(`${err.code || ''} ${err.type || ''} ${msg}`)) {
        return { type: 'daily', retryAfterMs, message: msg };
      }
      return { type: 'rate', retryAfterMs: retryAfterMs || 15000, message: msg };
    }
    if (status === 401 || status === 403 || /API_KEY_INVALID|API key not valid|invalid_api_key|API_KEY_SERVICE_BLOCKED/i.test(reasons + ' ' + msg)) {
      return { type: 'invalid', message: msg };
    }
    if (status === 404) return { type: 'fatal', message: `Model bulunamadı ya da erişim yok: ${msg}` };
    if (status === 408 || status >= 500) return { type: 'server', retryAfterMs: retryAfterMs || 4000, message: msg };
    if (status === 400) {
      if (/response_?schema|responseSchema|json schema|Invalid JSON payload.*schema/i.test(msg)) return { type: 'schema', message: msg };
      return { type: 'bad_request', message: msg };
    }
    return { type: 'server', retryAfterMs: 4000, message: msg };
  }

  async function readErrorBody(resp) {
    const txt = await resp.text().catch(() => '');
    try { return JSON.parse(txt); } catch (e) { return txt; }
  }

  function isGemini3(model) { return /^gemini-3/i.test(model); }

  async function callGemini({ key, model, system, user, schema, baseUrl, maxOutputTokens, temperature, signal, fetchImpl }) {
    const f = fetchImpl || fetch;
    const base = (baseUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
    const generationConfig = {
      maxOutputTokens: maxOutputTokens || 16384,
      responseMimeType: 'application/json'
    };
    // Gemini 3 models are tuned for their default temperature (1.0); forcing a low value can cause looping.
    const t = (temperature === null || temperature === undefined || temperature === '') ? (isGemini3(model) ? null : 0.2) : Number(temperature);
    if (t !== null && isFinite(t)) generationConfig.temperature = t;
    if (schema) generationConfig.responseSchema = schema;
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig
    };
    let resp;
    try {
      resp = await f(`${base}/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(body),
        signal
      });
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      throw new ApiError(`Ağ hatası: ${e.message}`, { type: 'network', retryAfterMs: 3000 });
    }
    if (!resp.ok) {
      const b = await readErrorBody(resp);
      const c = classifyHttpError(resp.status, b, resp.headers);
      throw new ApiError(`Gemini ${resp.status}: ${c.message}`, c);
    }
    const data = await resp.json();
    if (data.promptFeedback && data.promptFeedback.blockReason) {
      throw new ApiError(`İstek engellendi: ${data.promptFeedback.blockReason}`, { type: 'blocked' });
    }
    const cand = (data.candidates || [])[0] || {};
    const parts = (cand.content && cand.content.parts) || [];
    const text = parts.filter(p => !p.thought).map(p => p.text || '').join('');
    const u = data.usageMetadata || {};
    return {
      text,
      finishReason: cand.finishReason || '',
      truncated: cand.finishReason === 'MAX_TOKENS',
      usage: {
        promptTokens: u.promptTokenCount || 0,
        completionTokens: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0)
      }
    };
  }

  async function callOpenAICompatible({ key, model, system, user, baseUrl, temperature, signal, fetchImpl, provider }) {
    const f = fetchImpl || fetch;
    const base = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const body = {
      model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      response_format: { type: 'json_object' }
    };
    const t = (temperature === null || temperature === undefined || temperature === '') ? 0.2 : Number(temperature);
    if (isFinite(t)) body.temperature = t;
    let resp;
    try {
      resp = await f(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
        signal
      });
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      throw new ApiError(`Ağ hatası: ${e.message}`, { type: 'network', retryAfterMs: 3000 });
    }
    if (!resp.ok) {
      const b = await readErrorBody(resp);
      const c = classifyHttpError(resp.status, b, resp.headers);
      throw new ApiError(`${provider || 'OpenAI'} ${resp.status}: ${c.message}`, c);
    }
    const data = await resp.json();
    const ch = (data.choices || [])[0] || {};
    const u = data.usage || {};
    return {
      text: (ch.message && ch.message.content) || '',
      finishReason: ch.finish_reason || '',
      truncated: ch.finish_reason === 'length',
      usage: { promptTokens: u.prompt_tokens || 0, completionTokens: u.completion_tokens || 0 }
    };
  }

  // ------------------------------------------------------------
  // Parallel screening engine
  // ------------------------------------------------------------
  /**
   * @param {Object} cfg
   *  records: prepared records (already filtered: no duplicates/presets)
   *  models: [{ id, provider:'gemini'|'openai'|'deepseek', apiModel, baseUrl, pricing? }]
   *  pools:  { gemini: KeyPool, openai: KeyPool, deepseek: KeyPool }
   *  system: system instructions (string)
   *  batchSize, maxAttempts, useSchema, temperature, maxOutputTokens
   *  validation: { criteria, icLogic, reviewThreshold, userTopic, verifyEvidence, consensus }
   *  onRecord(finalRow), onProgress(info), onUsage(modelId, usage), onLog(msg), onFatal(err)
   *  signal: AbortSignal
   *  fetchImpl: optional fetch override (tests)
   */
  async function runScreening(cfg) {
    const batchSize = Math.max(1, cfg.batchSize || 5);
    const maxAttempts = cfg.maxAttempts || 4;
    const models = cfg.models;
    const modelOrder = models.map(m => m.id);
    const byRid = new Map(cfg.records.map(r => [r.rid, r]));
    const partial = new Map(); // rid -> { modelId: result }
    const schemaDisabled = new Set();
    const fatalModels = new Map();
    const log = cfg.onLog || (() => {});
    let finished = 0;
    const total = cfg.records.length;

    // Queues per provider
    // Each model uses a named key pool (default: its provider). A custom
    // OpenAI-compatible endpoint can have its own pool ("custom").
    const poolOf = m => m.pool || m.provider;
    const queues = {};
    models.forEach(m => { queues[poolOf(m)] = queues[poolOf(m)] || []; });
    for (let i = 0; i < cfg.records.length; i += batchSize) {
      const recs = cfg.records.slice(i, i + batchSize).map(r => r.rid);
      models.forEach(m => queues[poolOf(m)].push({ rids: recs, model: m, attempt: 0, rateRetries: 0 }));
    }
    let inflight = 0;

    const progress = () => cfg.onProgress && cfg.onProgress({
      finished, total, inflight,
      queued: Object.values(queues).reduce((s, q) => s + q.length, 0)
    });

    function deliver(rid, modelId, result) {
      if (!byRid.has(rid)) return;
      const p = partial.get(rid) || {};
      if (p[modelId]) return; // already have it
      p[modelId] = result;
      partial.set(rid, p);
      if (modelOrder.every(m => p[m])) {
        partial.delete(rid);
        finished++;
        const row = finalizeRecord(byRid.get(rid), p, modelOrder, cfg.validation);
        cfg.onRecord && cfg.onRecord(row);
      }
    }

    function failTask(task, message) {
      task.rids.forEach(rid => deliver(rid, task.model.id, errorModelRecord(message)));
    }

    async function execute(task, pool, signal) {
      const m = task.model;
      if (fatalModels.has(m.id)) { failTask(task, fatalModels.get(m.id)); return; }
      const recs = task.rids.map(r => byRid.get(r));
      const user = buildUserPrompt(recs);
      const slot = await pool.acquire(m.apiModel, signal);
      inflight++; progress();
      let resp;
      try {
        const args = {
          key: slot.key, model: m.apiModel, system: cfg.system, user,
          baseUrl: m.baseUrl, temperature: cfg.temperature, maxOutputTokens: cfg.maxOutputTokens,
          signal, fetchImpl: cfg.fetchImpl, provider: m.provider
        };
        if (m.provider === 'gemini') {
          args.schema = cfg.useSchema !== false && !schemaDisabled.has(m.id)
            ? buildResponseSchema({ userTopic: cfg.validation.userTopic }) : null;
          resp = await callGemini(args);
        } else {
          resp = await callOpenAICompatible(args);
        }
        pool.release(slot, { ok: true });
      } catch (e) {
        if (e.name === 'AbortError') { pool.release(slot, { type: 'abort' }); inflight--; throw e; }
        pool.release(slot, e.type ? e : { type: 'server', message: e.message });
        inflight--;
        const type = e.type || 'server';
        if (type === 'rate' || type === 'daily' || type === 'invalid') {
          task.rateRetries++;
          if (task.rateRetries > 50) { failTask(task, e.message); return; }
          log(`${slot.label}: ${type === 'rate' ? 'hız sınırı (429), anahtar beklemeye alındı' : type === 'daily' ? 'günlük kota doldu, anahtar devre dışı' : 'geçersiz anahtar, devre dışı'} — iş yeniden kuyruğa alındı`);
          queues[poolOf(m)].unshift(task);
          return;
        }
        if (type === 'schema') {
          schemaDisabled.add(m.id);
          log(`${m.id}: responseSchema desteklenmiyor, şemasız JSON moduna geçildi`);
          queues[poolOf(m)].unshift(task);
          return;
        }
        if (type === 'fatal') {
          fatalModels.set(m.id, e.message);
          log(`${m.id}: ${e.message} — bu modelin tüm işleri hata olarak işaretlenecek`);
          failTask(task, e.message);
          return;
        }
        task.attempt++;
        if (task.attempt < maxAttempts && type !== 'bad_request' && type !== 'blocked') {
          await sleep(Math.min(30000, (e.retryAfterMs || 2000) * Math.pow(2, task.attempt - 1)), signal);
          queues[poolOf(m)].push(task);
        } else if (task.rids.length > 1 && type !== 'fatal') {
          splitAndRequeue(task, queues[poolOf(m)]);
        } else {
          failTask(task, e.message);
        }
        return;
      }
      inflight--;
      cfg.onUsage && cfg.onUsage(m.id, resp.usage);

      const parsed = parseModelResponse(resp.text);
      const got = new Map();
      parsed.forEach(item => {
        const id = String(item.id || item.record_id || '').trim();
        if (task.rids.includes(id)) got.set(id, item);
      });
      // Positional fallback: single-record task with an unrecognised id
      if (task.rids.length === 1 && got.size === 0 && parsed.length === 1) got.set(task.rids[0], parsed[0]);

      got.forEach((item, rid) => {
        const rec = byRid.get(rid);
        deliver(rid, m.id, validateModelRecord(item, Object.assign({}, cfg.validation, { recordText: recordText(rec) })));
      });

      const missing = task.rids.filter(r => !got.has(r));
      if (missing.length) {
        const why = resp.truncated ? 'yanıt token sınırında kesildi'
          : parsed.length ? 'bazı kayıtlar yanıtta yok'
          : /[\[{]/.test(resp.text || '') ? 'yanıtta beklenen kayıt yok ya da JSON bozuk' : 'boş yanıt';
        const retry = { rids: missing, model: m, attempt: task.attempt + 1, rateRetries: 0 };
        if (retry.attempt >= maxAttempts) { failTask(retry, why); return; }
        log(`${m.id}: ${missing.length} kayıt yeniden denenecek (${why})`);
        if (missing.length > 1) splitAndRequeue(retry, queues[poolOf(m)]);
        else queues[poolOf(m)].push(retry);
      }
    }

    function splitAndRequeue(task, q) {
      const half = Math.ceil(task.rids.length / 2);
      q.push({ rids: task.rids.slice(0, half), model: task.model, attempt: task.attempt, rateRetries: 0 });
      q.push({ rids: task.rids.slice(half), model: task.model, attempt: task.attempt, rateRetries: 0 });
    }

    // Workers per provider
    const controller = new AbortController();
    const outer = cfg.signal;
    const onOuterAbort = () => controller.abort();
    if (outer) { if (outer.aborted) controller.abort(); else outer.addEventListener('abort', onOuterAbort, { once: true }); }
    const signal = controller.signal;
    let fatal = null;

    const workers = [];
    const active = {};
    Object.keys(queues).forEach(provider => {
      const pool = cfg.pools[provider];
      const q = queues[provider];
      active[provider] = 0;
      const n = Math.max(1, pool ? pool.capacity : 1);
      for (let w = 0; w < n; w++) {
        workers.push((async () => {
          // stagger start to avoid bursts
          await sleep(w * 150, signal).catch(() => {});
          while (!signal.aborted) {
            const task = q.shift();
            if (!task) {
              // another worker of this provider may still requeue work
              if (active[provider] > 0) { await sleep(200, signal).catch(() => {}); continue; }
              return;
            }
            active[provider]++;
            try {
              if (!pool) throw new PoolExhaustedError(`${provider} için anahtar havuzu yok`, 'no_keys');
              await execute(task, pool, signal);
            } catch (e) {
              if (e.name === 'AbortError') { q.unshift(task); active[provider]--; return; }
              if (e.name === 'PoolExhaustedError') {
                q.unshift(task);
                fatal = e;
                controller.abort();
                active[provider]--;
                return;
              }
              failTask(task, e.message);
            }
            active[provider]--;
            progress();
          }
        })());
      }
    });

    await Promise.all(workers);
    if (outer) outer.removeEventListener('abort', onOuterAbort);
    progress();
    if (fatal && cfg.onFatal) cfg.onFatal(fatal);
    return {
      completed: finished === total,
      finished, total,
      aborted: !!(outer && outer.aborted),
      fatal
    };
  }

  // ------------------------------------------------------------
  // Gemini Batch API helpers (async mode, 50% discount)
  // ------------------------------------------------------------
  const BATCH_INLINE_LIMIT_BYTES = 18 * 1024 * 1024; // documented inline limit is 20 MB

  /**
   * Groups records into batch requests and splits them into jobs that stay
   * under the inline size limit, distributing jobs across keys.
   * Returns [{ keyIndex, modelId, apiModel, requests:[{request, metadata:{key}}], rids:[] }]
   */
  function planBatchJobs({ records, models, keyCount, batchSize, system, userTopic, useSchema, temperature, maxOutputTokens }) {
    const jobs = [];
    const groups = [];
    for (let i = 0; i < records.length; i += batchSize) groups.push(records.slice(i, i + batchSize));
    const keys = Math.max(1, keyCount);
    models.forEach(m => {
      // round-robin groups over keys, then cut by size
      for (let k = 0; k < keys; k++) {
        let cur = null;
        groups.forEach((g, gi) => {
          if (gi % keys !== k) return;
          const generationConfig = { maxOutputTokens: maxOutputTokens || 16384, responseMimeType: 'application/json' };
          const t = (temperature === null || temperature === undefined || temperature === '') ? (isGemini3(m.apiModel) ? null : 0.2) : Number(temperature);
          if (t !== null && isFinite(t)) generationConfig.temperature = t;
          if (useSchema !== false) generationConfig.responseSchema = buildResponseSchema({ userTopic });
          const req = {
            request: {
              systemInstruction: { parts: [{ text: system }] },
              contents: [{ role: 'user', parts: [{ text: buildUserPrompt(g) }] }],
              generationConfig
            },
            metadata: { key: `${m.id}::${g.map(r => r.rid).join(',')}` }
          };
          const size = JSON.stringify(req).length + 64;
          if (!cur || cur.bytes + size > BATCH_INLINE_LIMIT_BYTES) {
            cur = { keyIndex: k, modelId: m.id, apiModel: m.apiModel, requests: [], rids: [], bytes: 0 };
            jobs.push(cur);
          }
          cur.requests.push(req);
          cur.rids.push(...g.map(r => r.rid));
          cur.bytes += size;
        });
      }
    });
    return jobs.map(({ bytes, ...j }) => j);
  }

  function batchJobState(job) {
    const s = String((job.metadata && job.metadata.state) || job.state || '').toUpperCase();
    if (/SUCCEEDED$/.test(s)) return 'succeeded';
    if (/(FAILED|CANCELLED|CANCELED|EXPIRED)$/.test(s)) return 'failed';
    if (job.done && job.error) return 'failed';
    if (job.done && job.response) return 'succeeded';
    return 'running';
  }

  /** Extracts [{ key, text, usage, error, truncated }] from a finished job or JSONL text. */
  function parseBatchResponses(jobOrJsonl) {
    const out = [];
    const handle = (item, idx) => {
      // Inline responses are returned in request order and may not echo metadata.key
      const key = (item.metadata && item.metadata.key) || item.key || null;
      if (item.error) { out.push({ key, index: idx, error: item.error.message || JSON.stringify(item.error) }); return; }
      const r = item.response || {};
      const cand = (r.candidates || [])[0] || {};
      const parts = (cand.content && cand.content.parts) || [];
      const u = r.usageMetadata || {};
      out.push({
        key,
        index: idx,
        text: parts.filter(p => !p.thought).map(p => p.text || '').join(''),
        truncated: cand.finishReason === 'MAX_TOKENS',
        usage: { promptTokens: u.promptTokenCount || 0, completionTokens: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0) }
      });
    };
    if (typeof jobOrJsonl === 'string') {
      jobOrJsonl.split(/\r?\n/).filter(Boolean).forEach((line, i) => {
        try { handle(JSON.parse(line), i); } catch (e) { /* skip */ }
      });
      return out;
    }
    const resp = jobOrJsonl.response || (jobOrJsonl.dest) || {};
    const inl = resp.inlinedResponses;
    const list = Array.isArray(inl) ? inl : (inl && inl.inlinedResponses) || [];
    list.forEach(handle);
    return out;
  }

  function batchResponsesFile(job) {
    const r = job.response || job.dest || {};
    return r.responsesFile || r.fileName || '';
  }

  // ------------------------------------------------------------
  // Export (shared by web UI and CLI)
  // ------------------------------------------------------------
  function buildExportRows(run, rows, modelLabel) {
    const label = modelLabel || (id => id);
    const codes = [...run.criteria.inclusion, ...run.criteria.exclusion].map(c => c.code);
    return rows.map((r, i) => {
      const row = {
        'Sıra': i + 1,
        'ID': r.id,
        'İç ID': r.rid,
        'Excel Satırı': r.source_row || '',
        'DOI': r.doi || '',
        'Yazar(lar)': r.authors,
        'Başlık': r.title,
        'Yıl': r.year,
        'Abstract (Orijinal)': r.abstract
      };
      run.activeModels.forEach(m => {
        const d = (r.modelDecisions || {})[m];
        row[`Karar: ${label(m)}`] = d ? (d.error ? `HATA: ${d.error}` : d.decision) : '';
      });
      Object.assign(row, {
        'AI Kararı': r.ai_decision,
        'İnsan Kararı': r.human_decision || '',
        'Nihai Karar': r.decision,
        'Güven': typeof r.confidence === 'number' ? Number(r.confidence.toFixed(2)) : '',
        'Model Uyumu': r.agreement || ''
      });
      codes.forEach(c => { row[c] = (r.assessment || {})[c] || ''; });
      Object.assign(row, {
        'Karşılanan IC': (r.matched_inclusion_criteria || []).join('; '),
        'Karşılanan EC': (r.matched_exclusion_criteria || []).join('; '),
        'Kısa Gerekçe': splitRationale(r).text,
        'Hariç Tutma Gerekçesi': r.exclusion_reason || '',
        'Kanıt Alıntıları': Object.entries(r.evidence || {}).map(([c, q]) => `${c}: "${q}"`).join(' | '),
        'Konu İlgisi': typeof r.relevance_score === 'number' ? Math.round(r.relevance_score * 100) / 100 : '',
        'İlişki Gerekçesi': r.relevance_rationale || '',
        'İnceleme Gerekli': r.needs_human_review ? 'Evet' : 'Hayır',
        'Sistem Denetimi': splitRationale(r).flags.join('; '),
        'Hata': r.error || '',
        'Prompt Versiyon': run.promptHash
      });
      return row;
    });
  }

  function buildMetadataRows(run, rows) {
    const all = rows;
    const count = d => all.filter(r => r.decision === d).length;
    const pairs = agreementStats(all, run.activeModels);
    const o = run.options;
    return [
      ['Anahtar', 'Değer'],
      ['Araç sürümü', `Gemini Literature Screening v${VERSION}`],
      ['Dışa aktarma (UTC)', new Date().toISOString()],
      ['Analiz başlangıcı', run.createdAt],
      ['Dosya', `${run.fileName} (hash ${run.fileHash})`],
      ['Modeller', run.models.map(m => `${m.id} → ${m.apiModel}`).join('; ')],
      ['Mod', run.mode === 'async' ? 'Gemini Batch API' : 'Paralel (Standard)'],
      ['İstek başına kayıt', run.batchSize],
      ['Temperature', o.temperature === null ? 'otomatik' : o.temperature],
      ['Prompt versiyonu (SHA-256[0:8])', run.promptHash],
      ['', ''],
      ['KARAR MANTIĞI', ''],
      ['IC birleşimi', o.icLogic === 'any' ? 'En az biri (VEYA)' : 'Tümü (VE)'],
      ['EC birleşimi', 'Herhangi biri (VEYA)'],
      ['Karar kuralı', 'Herhangi EC=evet → Exclude; IC başarısız → Exclude; IC karşılandı ve tüm EC=hayır → Include; aksi hâlde Uncertain. Model kararı ölçüt değerlendirmesiyle çelişirse → Uncertain + insan incelemesi.'],
      ['İnsan incelemesi eşiği', o.reviewThreshold],
      ['Çoklu model uzlaşısı', o.consensus],
      ['Kanıt doğrulaması', o.verifyEvidence ? 'Açık' : 'Kapalı'],
      ['Tekrar ayıklama', o.dedupe ? 'Açık (DOI, başlık+yıl)' : 'Kapalı'],
      ['Özeti olmayan kayıtlar', o.noAbstractMode === 'skip' ? 'Taranmadı → Uncertain' : 'Başlık/anahtar kelime ile tarandı'],
      ['', ''],
      ['PRISMA (başlık/özet taraması)', ''],
      ['Tanımlanan kayıt', run.records.length],
      ['Tekrar olarak ayıklanan', count('Duplicate')],
      ['Taranan kayıt', run.records.length - count('Duplicate')],
      ['Include', count('Include')],
      ['Exclude', count('Exclude')],
      ['Uncertain', count('Uncertain')],
      ['İnsan incelemesi işaretli', all.filter(r => r.needs_human_review).length],
      ['İnsan tarafından karar verilen', all.filter(r => r.human_decision).length],
      ['AI kararı insan tarafından değiştirilen', all.filter(r => r.human_decision && r.human_decision !== r.ai_decision).length],
      ['API hatası', all.filter(r => r.error).length],
      ...pairs.map(p => [`Cohen κ (${p.a} – ${p.b})`, `${p.kappa.toFixed(3)} · gözlenen uyum ${(p.observed * 100).toFixed(1)}% · n=${p.n}`]),
      ['', ''],
      ['Toplam input token', run.usage.input],
      ['Toplam output token (düşünme dahil)', run.usage.output],
      ['Tahmini maliyet (USD)', typeof run.usage.cost === 'number' ? run.usage.cost.toFixed(6) : 'hesaplanmadı (CLI: token sayılarına bakın)'],
      ['', ''],
      ['DAHİL ETME ÖLÇÜTLERİ', ''],
      ...run.criteria.inclusion.map(c => [c.code, c.text]),
      ['HARİÇ TUTMA ÖLÇÜTLERİ', ''],
      ...run.criteria.exclusion.map(c => [c.code, c.text]),
      ['', ''],
      ['Kullanıcının araştırma konusu', o.userTopic || '-'],
      ['Sistem talimatı (tam metin)', run.system]
    ];
  }

  // ------------------------------------------------------------
  // Presentation helpers (shared by web UI and exports)
  // ------------------------------------------------------------
  /**
   * One short justification per record. v12 rows kept a separate English
   * "summary" and appended audit notes to the rationale in brackets; both
   * are folded into { text, flags } here.
   */
  function splitRationale(r) {
    const flags = [...((r && r.flags) || [])];
    let rationale = String((r && r.rationale) || '');
    rationale = rationale.replace(/\[(?:⚠️ )?Sistem denetimi: ([^\]]*)\]/g, (_, f) => { flags.push(...f.split('; ')); return ''; });
    rationale = rationale.replace(/\[(Model uyuşmazlığı: [^\]]*)\]/g, (_, f) => { flags.unshift(f); return ''; });
    rationale = rationale.replace(/\[(Hata veren model\(ler\): [^\]]*)\]/g, (_, f) => { flags.push(f); return ''; });
    const summary = String((r && r.summary) || '').trim();
    const text = [summary, rationale.replace(/\s+/g, ' ').trim()].filter(Boolean).join(' ');
    return { text, flags: [...new Set(flags.map(f => f.trim()).filter(Boolean))] };
  }

  const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Whitespace, dashes and quote marks vary between the model's copy and the source
  function quotePattern(fragment) {
    return fragment.split(/[\s\-‐‑–—]+/).filter(Boolean)
      .map(w => escapeRegExp(w).replace(/['’‘`]/g, "['’‘`]").replace(/["“”]/g, '["“”]'))
      .join('[\\s\\-‐‑–—]+');
  }

  /**
   * Character ranges of verbatim evidence quotes inside a text.
   * evidence: { IC1: "quote", EC2: "quote" }  (quotes may contain "..." gaps)
   * Returns merged, sorted [{ start, end, codes: [...] }].
   */
  function evidenceRanges(text, evidence) {
    const src = String(text || '');
    if (!src) return [];
    const raw = [];
    Object.entries(evidence || {}).forEach(([code, quote]) => {
      String(quote || '')
        .split(/\s*(?:\.{3}|…)\s*/)
        .map(f => f.trim().replace(/^["“”'‘’\s]+|["“”'‘’\s.,;:]+$/g, ''))
        .filter(f => f.length >= 4 && !/^\d+$/.test(f))
        .forEach(f => {
          let re;
          try { re = new RegExp(quotePattern(f), 'giu'); } catch (e) { return; }
          let m, guard = 0;
          while ((m = re.exec(src)) !== null && guard++ < 20) {
            if (!m[0].length) { re.lastIndex++; continue; }
            raw.push({ start: m.index, end: m.index + m[0].length, codes: [code] });
          }
        });
    });
    raw.sort((a, b) => a.start - b.start || b.end - a.end);
    const out = [];
    raw.forEach(r => {
      const last = out[out.length - 1];
      if (last && r.start <= last.end) {
        last.end = Math.max(last.end, r.end);
        r.codes.forEach(c => { if (!last.codes.includes(c)) last.codes.push(c); });
      } else out.push({ start: r.start, end: r.end, codes: [...r.codes] });
    });
    return out;
  }

  function titleTokens(title) {
    return new Set(normText(title).split(' ').filter(t => t.length > 2));
  }

  function jaccard(a, b) {
    if (!a.size || !b.size) return 0;
    let inter = 0;
    a.forEach(t => { if (b.has(t)) inter++; });
    return inter / (a.size + b.size - inter);
  }

  /**
   * Near-duplicate candidates that exact DOI / title+year matching misses
   * (punctuation, word order, subtitle, one-year drift). Sorted-neighbourhood
   * blocking keeps it O(n log n) for 20k+ records.
   * records: [{ rid, order, Title, Year, DOI, duplicateOf, removed, notDupOf }]
   * Returns [{ a, b, score, kind }] with a = earlier record, b = candidate duplicate.
   */
  function findDuplicateCandidates(records, opts = {}) {
    const threshold = opts.threshold || 0.85;
    const window = opts.window || 8;
    const pool = records.filter(r => !r.removed && !r.duplicateOf && normText(r.Title).length >= 20);
    const info = new Map(pool.map(r => [r.rid, {
      r, tokens: titleTokens(r.Title), doi: normalizeDoi(r.DOI), year: parseInt(r.Year, 10)
    }]));
    const best = new Map(); // b.rid -> pair
    const consider = (x, y, score, kind) => {
      const [a, b] = x.r.order <= y.r.order ? [x.r, y.r] : [y.r, x.r];
      if ((a.notDupOf || []).includes(b.rid) || (b.notDupOf || []).includes(a.rid)) return;
      const prev = best.get(b.rid);
      if (!prev || score > prev.score) best.set(b.rid, { a: a.rid, b: b.rid, score: Math.round(score * 100) / 100, kind });
    };
    const byDoi = new Map();
    info.forEach(x => {
      if (!x.doi) return;
      if (byDoi.has(x.doi)) consider(byDoi.get(x.doi), x, 1, 'doi');
      else byDoi.set(x.doi, x);
    });
    const keys = [
      x => normText(x.r.Title),
      x => [...x.tokens].sort().join(' ')
    ];
    keys.forEach(keyFn => {
      const sorted = [...info.values()].map(x => [keyFn(x), x]).sort((p, q) => (p[0] < q[0] ? -1 : p[0] > q[0] ? 1 : 0));
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < Math.min(sorted.length, i + 1 + window); j++) {
          const x = sorted[i][1], y = sorted[j][1];
          if (x.doi && y.doi && x.doi !== y.doi) continue;
          if (isFinite(x.year) && isFinite(y.year) && Math.abs(x.year - y.year) > 1) continue;
          const s = jaccard(x.tokens, y.tokens);
          if (s >= threshold) consider(x, y, s, 'fuzzy');
        }
      }
    });
    // a record kept as "a" must not itself be proposed for removal against a third one
    const pairs = [...best.values()].sort((p, q) => q.score - p.score);
    const asB = new Set();
    return pairs.filter(p => {
      if (asB.has(p.a)) return false;
      asB.add(p.b);
      return true;
    });
  }

  // Cost estimation
  function estimateTokens(text) { return Math.ceil(String(text || '').length / 4); }

  return {
    VERSION, DECISIONS, DECISION_RANK, DEFAULT_OPTIONS, COLUMN_ALIASES,
    sleep, fingerprint, maskKey, quotaDay, normText,
    parseCriteria, normalizeCode, codesMentioned, checkGuidanceConsistency,
    deriveDecision, buildProtocol, buildSystemInstructions, buildUserPrompt, buildResponseSchema,
    parseModelResponse, normalizeDecision, normalizeVerdict, parseConfidence, evidenceSupported,
    validateModelRecord, errorModelRecord, consensus, cohenKappa, agreementStats,
    findColumn, mapColumns, prepareRecords, recordText, presetResult, finalizeRecord,
    KeyPool, PoolExhaustedError, ApiError, classifyHttpError, callGemini, callOpenAICompatible,
    runScreening, planBatchJobs, batchJobState, parseBatchResponses, batchResponsesFile,
    estimateTokens, buildExportRows, buildMetadataRows,
    normalizeDoi, splitRationale, evidenceRanges, findDuplicateCandidates
  };
});
