// Deterministic fake Gemini / OpenAI-compatible endpoint used by the tests
// and by the browser end-to-end check. Decisions are driven by markers in
// the record title:
//   [INC]   -> IC1=yes, IC2=yes, EC*=no  -> Include
//   [EC4]   -> EC4=yes                    -> Exclude
//   [NOIC]  -> IC1=no                     -> Exclude
//   [UNC]   -> IC2=unclear                -> Uncertain
//   [LIE]   -> verdicts say Include but decision says Exclude (inconsistent)
//   [FAKE]  -> IC1=yes with evidence that is not in the text
//   [SKIP]  -> omitted from the response (engine must retry)

export function screenRecordsFromPrompt(userText, opts = {}) {
  const recs = [...userText.matchAll(/<record id="(R\d+)">\s*TITLE: ([^\n]*)[\s\S]*?ABSTRACT: ([^\n]*)/g)]
    .map(m => ({ rid: m[1], title: m[2], abstract: m[3] }));
  const codes = opts.codes || { ic: ['IC1', 'IC2'], ec: ['EC1', 'EC2', 'EC3', 'EC4', 'EC5'] };
  const results = [];
  for (const r of recs) {
    if (r.title.includes('[SKIP]') && !opts.noSkip) continue;
    const v = {};
    codes.ic.forEach(c => { v[c] = 'yes'; });
    codes.ec.forEach(c => { v[c] = 'no'; });
    let decision = 'Include';
    let evidence = r.abstract.split(' ').slice(0, 6).join(' ');
    if (r.title.includes('[EC4]')) { v.EC4 = 'yes'; decision = 'Exclude'; }
    else if (r.title.includes('[NOIC]')) { v.IC1 = 'no'; decision = 'Exclude'; }
    else if (r.title.includes('[UNC]')) { v.IC2 = 'unclear'; decision = 'Uncertain'; }
    else if (r.title.includes('[LIE]')) { decision = 'Exclude'; }
    else if (r.title.includes('[FAKE]')) { evidence = 'students chose quantum basket weaving hobbies'; }
    else if (!r.title.includes('[INC]')) { v.IC1 = 'no'; decision = 'Exclude'; }
    results.push({
      id: r.rid,
      summary: `Summary of ${r.rid}`,
      criteria_assessment: Object.entries(v).map(([code, verdict]) => ({ code, verdict, evidence: verdict === 'unclear' ? '' : evidence })),
      decision,
      confidence: decision === 'Uncertain' ? 0.55 : 0.95,
      needs_human_review: decision === 'Uncertain',
      rationale: `Mock rationale for ${r.rid}`,
      relevance_score: 0.5,
      relevance_rationale: 'mock'
    });
  }
  return { results };
}

/**
 * Creates a fetch() replacement.
 * behaviour: { rateLimitKeys: {key: n}, invalidKeys: [key], dailyKeys: [key], schemaError: bool, calls: [] }
 */
export function createMockFetch(behaviour = {}) {
  const calls = behaviour.calls || [];
  const rl = Object.assign({}, behaviour.rateLimitKeys || {});
  let schemaErrorsLeft = behaviour.schemaError ? 1 : 0;
  const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

  return async function mockFetch(url, init = {}) {
    const u = String(url);
    const headers = init.headers || {};
    const key = headers['x-goog-api-key'] || (headers.Authorization || '').replace('Bearer ', '');
    const body = init.body ? JSON.parse(init.body) : {};
    calls.push({ url: u, key, at: Date.now() });
    if (behaviour.latencyMs) await new Promise(r => setTimeout(r, behaviour.latencyMs));

    if ((behaviour.invalidKeys || []).includes(key)) {
      return json(400, { error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT', details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'API_KEY_INVALID' }] } });
    }
    if ((behaviour.dailyKeys || []).includes(key)) {
      return json(429, { error: { code: 429, message: 'Quota exceeded', status: 'RESOURCE_EXHAUSTED', details: [
        { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] }] } });
    }
    if (rl[key] > 0) {
      rl[key]--;
      return json(429, { error: { code: 429, message: 'Resource exhausted', status: 'RESOURCE_EXHAUSTED', details: [
        { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '0.2s' }] } });
    }

    if (u.includes(':generateContent')) {
      if (schemaErrorsLeft > 0 && body.generationConfig && body.generationConfig.responseSchema) {
        schemaErrorsLeft--;
        return json(400, { error: { code: 400, message: 'Invalid JSON payload received. Unknown name "responseSchema"', status: 'INVALID_ARGUMENT' } });
      }
      const user = body.contents[0].parts[0].text;
      const out = screenRecordsFromPrompt(user, behaviour);
      return json(200, {
        candidates: [{ content: { parts: [{ text: JSON.stringify(out) }] }, finishReason: 'STOP' }],
        usageMetadata: { promptTokenCount: Math.ceil(user.length / 4), candidatesTokenCount: 100, thoughtsTokenCount: 10 }
      });
    }
    if (u.includes('/chat/completions')) {
      const user = body.messages.find(m => m.role === 'user').content;
      const out = screenRecordsFromPrompt(user, behaviour);
      return json(200, { choices: [{ message: { content: JSON.stringify(out) }, finish_reason: 'stop' }], usage: { prompt_tokens: 100, completion_tokens: 50 } });
    }
    if (/\/models(\?|$)/.test(u)) return json(200, { models: [{ name: 'models/gemini-test' }] });
    return json(404, { error: { message: 'not found' } });
  };
}
