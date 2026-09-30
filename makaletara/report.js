// ============================================================
// REPORT — PRISMA 2020 flow diagram and a Word report (v17)
//  • PRISMA numbers are computed from the screening data; every number can be
//    overridden (full-text stage happens outside this tool) and is kept per project
//  • the report prose is written by the model from facts only (counts, protocol,
//    included studies); figure and tables are built by code, so numbers in them
//    never come from the model. The draft is editable here and exported as .docx
// ============================================================
/* global WS, C, el, run, Prisma, Assist, isActive, isPendingDup, usedTerms, shortAuthors, modelShort, icLogicText,
          versionSummary, triggerDownload, showError, showSuccess, text, button, refreshIcons, switchTab, debounce,
          formatTokens, downloadProtocolText, personName, localDate */

const Report = (() => {
  const DOCX_URL = 'https://cdn.jsdelivr.net/npm/docx@9.5.1/dist/index.iife.js';
  const lsKey = k => `gls_${k}_${Assist.projectKey()}`;

  // ------------------------------------------------------------
  // PRISMA numbers
  // ------------------------------------------------------------
  function effective(rec) {
    const h = Assist.humanDecision(rec);
    if (h) return { d: h, src: 'human' };
    const a = WS.ai.get(rec.rid);
    const d = a && !a.error && !WS.aiHidden ? a.ai_decision || a.decision : '';
    return { d, src: d ? 'ai' : '' };
  }

  function defaultSourceLabel() {
    return WS.isCloud ? (WS.project.file_name || WS.project.name) : (run && run.fileName) || 'Dosya';
  }

  /** Numbers derived from the records (title/abstract stage). */
  function computed() {
    const recs = WS.records;
    const bySrc = new Map();
    recs.forEach(r => { const l = r.sourceLabel || defaultSourceLabel(); bySrc.set(l, (bySrc.get(l) || 0) + 1); });
    const dupRemoved = r => r.removed && (r.duplicateOf || /^Tekrar/.test(r.removedReason || ''));
    const active = recs.filter(isActive);
    const c = { exH: 0, exA: 0, inc: 0, may: 0, none: 0, aiOnly: 0 };
    active.forEach(r => {
      const e = effective(r);
      if (e.src === 'ai') c.aiOnly++;
      if (e.d === 'Exclude') { if (e.src === 'human') c.exH++; else c.exA++; }
      else if (e.d === 'Include') c.inc++;
      else if (e.d === 'Uncertain') c.may++;
      else c.none++;
    });
    return {
      sources: [...bySrc].map(([label, n]) => ({ label, n })), registers: 0,
      duplicates: recs.filter(r => dupRemoved(r) || isPendingDup(r)).length,
      automation: 0,
      otherRemoved: recs.filter(r => !dupRemoved(r) && !isPendingDup(r) && (r.removed || r.archived)).length,
      screened: active.length, excludedHuman: c.exH, excludedAuto: c.exA,
      sought: c.inc + c.may, notRetrieved: 0, reasons: [],
      stats: c
    };
  }

  function edits() { try { return JSON.parse(Assist.lsGet(lsKey('prisma'), '{}')); } catch (e) { return {}; } }
  function saveEdits(e) { Assist.lsSet(lsKey('prisma'), JSON.stringify(e)); }

  /** Computed numbers with the user's overrides; dependent boxes follow unless set by hand. */
  function current() {
    const base = computed();
    const e = edits();
    const d = Object.assign({}, base, e);
    const v = k => Number(d[k]) || 0;
    d.excluded = v('excludedHuman') + v('excludedAuto');
    if (e.assessed === undefined) d.assessed = Math.max(0, v('sought') - v('notRetrieved'));
    const rx = (d.reasons || []).reduce((s, r) => s + (Number(r.n) || 0), 0);
    if (e.included === undefined) d.included = Math.max(0, v('assessed') - rx);
    if (e.reportsIncluded === undefined) d.reportsIncluded = d.included;
    return { data: d, base, edits: e };
  }

  function prismaSvg() { return Prisma.flowSvg(current().data, el.prismaLang.value); }

  async function prismaPngBlob(scale = 2) {
    const { svg, width, height } = prismaSvg();
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await img.decode();
    const cv = document.createElement('canvas');
    cv.width = width * scale; cv.height = height * scale;
    const ctx = cv.getContext('2d');
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    return { blob: await new Promise(res => cv.toBlob(res, 'image/png')), width, height, dataUrl: cv.toDataURL('image/png') };
  }

  const fileBase = () => String(WS.isCloud ? WS.project.name : (run && run.fileName) || 'tarama').replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 40);

  function renderPrisma() {
    const { data, base, edits: e } = current();
    el.prismaFigure.innerHTML = Prisma.flowSvg(data, el.prismaLang.value).svg;
    const s = base.stats;
    el.prismaNote.textContent = `Karar önceliği: ${WS.isCloud ? 'nihai karar, yoksa oyunuz' : 'oyunuz'}, yoksa AI kararı. `
      + `${s.aiOnly.toLocaleString('tr-TR')} kaydın kararı yalnızca AI'dan geliyor (şemada ** ile "otomasyon araçlarıyla" satırı). `
      + (s.none ? `${s.none.toLocaleString('tr-TR')} kayıt henüz karar almamış. ` : '')
      + 'Tam metin aşaması (erişim, uygunluk, dahil edilen) bu aracın dışındadır; o kutuları siz doldurun. Değişiklikler bu tarayıcıda proje başına saklanır.';
    renderFields(data, base, e);
    updateReportFigure();
  }

  function setEdit(k, v) {
    const e = edits();
    if (v === '' || v === null) delete e[k]; else e[k] = v;
    saveEdits(e);
    renderPrisma();
  }

  function renderFields(d, base, e) {
    const box = el.prismaFields;
    if (box.contains(document.activeElement)) { el.prismaFigure.innerHTML = Prisma.flowSvg(d, el.prismaLang.value).svg; return; }
    box.textContent = '';
    const group = title => { const g = document.createElement('fieldset'); g.className = 'pf-group'; g.appendChild(text('legend', title)); box.appendChild(g); return g; };
    const numField = (g, k, label, hint) => {
      const l = document.createElement('label');
      l.className = 'pf-row' + (e[k] !== undefined ? ' edited' : '');
      const inp = document.createElement('input');
      inp.type = 'number'; inp.min = '0'; inp.className = 'ui-input pf-num';
      inp.value = e[k] !== undefined ? e[k] : '';
      inp.placeholder = String(d[k] ?? base[k] ?? '');
      inp.title = hint || 'Boş bırakılırsa hesaplanan değer kullanılır';
      inp.addEventListener('change', () => setEdit(k, inp.value === '' ? '' : Math.max(0, parseInt(inp.value, 10) || 0)));
      l.append(text('span', label, 'pf-label'), inp);
      g.appendChild(l);
    };
    const listField = (g, k, labelPh) => {
      const list = (e[k] !== undefined ? e[k] : d[k]) || [];
      list.forEach((it, i) => {
        const row = document.createElement('div');
        row.className = 'pf-row pf-list';
        const lab = document.createElement('input');
        lab.type = 'text'; lab.className = 'ui-input'; lab.value = it.label || ''; lab.placeholder = labelPh;
        const nn = document.createElement('input');
        nn.type = 'number'; nn.min = '0'; nn.className = 'ui-input pf-num'; nn.value = it.n ?? '';
        const commit = () => { const next = list.map((x, j) => (j === i ? { label: lab.value.trim(), n: nn.value === '' ? '' : Math.max(0, parseInt(nn.value, 10) || 0) } : x)); setEdit(k, next); };
        lab.addEventListener('change', commit); nn.addEventListener('change', commit);
        row.append(lab, nn, button('×', 'ui-btn ui-btn-ghost ui-btn-xs', () => setEdit(k, list.filter((x, j) => j !== i)), 'Satırı sil'));
        g.appendChild(row);
      });
      g.appendChild(button('+ Satır ekle', 'ui-btn ui-btn-ghost ui-btn-xs', () => setEdit(k, [...list, { label: '', n: '' }])));
    };
    const gi = group('Belirleme');
    listField(gi, 'sources', 'Veri tabanı (ör. Scopus)');
    numField(gi, 'registers', 'Kayıt sistemleri');
    const gr = group('Taramadan önce çıkarılan');
    numField(gr, 'duplicates', 'Tekrar kayıtlar');
    numField(gr, 'automation', 'Otomasyonla uygun değil');
    numField(gr, 'otherRemoved', 'Diğer nedenler (arşiv vb.)');
    const gs = group('Başlık / özet taraması');
    numField(gs, 'screened', 'Taranan kayıtlar');
    numField(gs, 'excludedHuman', 'Hariç: insan kararıyla');
    numField(gs, 'excludedAuto', 'Hariç: yalnızca AI kararıyla');
    const gf = group('Tam metin (sizin doldurmanız gerekir)');
    numField(gf, 'sought', 'Erişilmeye çalışılan raporlar', 'Varsayılan: Include + Maybe');
    numField(gf, 'notRetrieved', 'Erişilemeyen raporlar');
    numField(gf, 'assessed', 'Uygunluk için değerlendirilen', 'Varsayılan: erişilmeye çalışılan − erişilemeyen');
    gf.appendChild(text('div', 'Hariç tutulan raporlar (neden ve sayı)', 'pf-sub'));
    listField(gf, 'reasons', 'Neden (ör. Yanlış popülasyon)');
    const gd = group('Dahil edilen');
    numField(gd, 'included', 'Dahil edilen çalışmalar', 'Varsayılan: değerlendirilen − hariç tutulan raporlar');
    numField(gd, 'reportsIncluded', 'Dahil edilen çalışmaların raporları');
  }

  // ------------------------------------------------------------
  // Report: facts → model → editable document → .docx
  // ------------------------------------------------------------
  function protocolOf() { return WS.isCloud ? WS.project.protocol || {} : run || {}; }

  function reviewerAgreement() {
    if (!WS.isCloud || WS.blindForMe) return [];
    const users = new Map();
    WS.votes.forEach((m, rid) => m.forEach((v, uid) => { if (v.decision) { if (!users.has(uid)) users.set(uid, new Map()); users.get(uid).set(rid, v.decision); } }));
    const ids = [...users.keys()];
    const out = [];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = [], b = [];
      users.get(ids[i]).forEach((d, rid) => { const e = users.get(ids[j]).get(rid); if (e) { a.push(d); b.push(e); } });
      const k = C.cohenKappa(a, b);
      if (k && k.n >= 10) out.push({ pair: `${personName(ids[i])} – ${personName(ids[j])}`, n: k.n, kappa: Math.round(k.kappa * 1000) / 1000, agreement: Math.round(k.observed * 1000) / 10 });
    }
    return out;
  }

  function includedStudies() {
    return Assist.scopeRecords(el.reportScope.value).slice().sort((a, b) => a.order - b.order);
  }

  function facts() {
    const p = protocolOf();
    const crit = WS.criteria;
    const pr = current().data;
    const incl = includedStudies();
    const themeCfg = Assist.themeConfig();
    const themeDist = new Map();
    incl.forEach(r => Assist.effectiveThemes(r).forEach(t => themeDist.set(t, (themeDist.get(t) || 0) + 1)));
    const reasons = [...usedTerms().reasons].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([reason, n]) => ({ reason, n }));
    const models = (p.activeModels || []).map(m => modelShort(m));
    const ai = [...WS.ai.values()];
    const modelKappa = (p.activeModels || []).length > 1 ? C.agreementStats(ai, p.activeModels).map(k => ({ pair: `${modelShort(k.a)} – ${modelShort(k.b)}`, n: k.n, kappa: Math.round(k.kappa * 1000) / 1000 })) : [];
    const versions = WS.isCloud && WS.versions ? versionSummary().length : 1;
    const o = p.options || {};
    return {
      project: { name: WS.isCloud ? WS.project.name : (run && run.fileName) || '', report_date: new Date().toLocaleDateString('tr-TR'), team_project: WS.isCloud },
      prisma_2020: {
        records_identified_by_database: pr.sources, registers: pr.registers, duplicates_removed: pr.duplicates,
        removed_by_automation_before_screening: pr.automation, removed_other_reasons: pr.otherRemoved,
        records_screened: pr.screened, records_excluded: pr.excluded, excluded_by_human: pr.excludedHuman, excluded_by_ai_only: pr.excludedAuto,
        reports_sought: pr.sought, reports_not_retrieved: pr.notRetrieved, reports_assessed: pr.assessed,
        reports_excluded_with_reasons: (pr.reasons || []).filter(r => r.label), studies_included: pr.included
      },
      protocol: {
        inclusion_criteria: crit.inclusion.map(c => `${c.code}: ${c.text}`),
        exclusion_criteria: crit.exclusion.map(c => `${c.code}: ${c.text}`),
        inclusion_logic: icLogicText(crit, o),
        exclusion_logic: 'any exclusion criterion met excludes the record',
        decision_rule: 'The model rates every criterion yes/no/unclear with a verbatim quote; the decision is derived deterministically in code; contradictions and low confidence go to human review.',
        human_review_threshold: o.reviewThreshold, evidence_verification: o.verifyEvidence !== false,
        models, multi_model_consensus: models.length > 1 ? o.consensus : null, prompt_version: p.promptHash || null,
        ai_result_versions_in_project: versions
      },
      screening: {
        decision_priority: WS.isCloud ? 'final decision, else my vote, else AI' : 'my vote, else AI',
        title_abstract_counts: { include: current().base.stats.inc, maybe: current().base.stats.may, exclude: pr.excluded, undecided: current().base.stats.none, decided_by_ai_only: current().base.stats.aiOnly },
        reviewers: WS.isCloud ? (WS.members || []).length + 1 : 1, blind_mode: WS.isCloud ? !!WS.project.blind : null,
        inter_reviewer_agreement_kappa: reviewerAgreement(), inter_model_agreement_kappa: modelKappa,
        most_used_exclusion_reasons: reasons
      },
      thematic_analysis: themeCfg.groups.length > 1 && themeDist.size ? {
        research_goal: themeCfg.goal, themes: themeCfg.groups,
        distribution_among_included: [...themeDist].map(([theme, n]) => ({ theme, n })).sort((a, b) => b.n - a.n),
        note: 'Each study was assigned one primary and at most one secondary predefined theme by the model from title/abstract, then confirmed or corrected by a person.'
      } : null,
      included_studies_total: incl.length,
      included_studies_sample: incl.slice(0, 120).map(r => {
        const a = WS.ai.get(r.rid);
        return { id: r.rid, authors: shortAuthors(r.Authors), year: r.Year, title: r.Title, themes: Assist.effectiveThemes(r), note: a ? C.splitRationale(a).text.slice(0, 260) : '' };
      }),
      tables_and_figures_added_by_the_tool: ['Figure 1: PRISMA 2020 flow diagram', 'Table 1: eligibility criteria', 'Table 2: theme distribution (if any)', 'Table 3: list of included studies']
    };
  }

  const KIND = {
    methods_results: {
      tr: 'Şu bölümleri yaz: "Yöntem" (alt başlıklar: Uygunluk ölçütleri; Bilgi kaynakları ve kayıtların yönetimi; Tekrarların ayıklanması; Tarama süreci; Yapay zekâ desteği ve insan doğrulaması; varsa Tematik sınıflandırma), "Bulgular" (alt başlıklar: Çalışmaların seçimi; Dahil edilen çalışmaların genel görünümü; varsa Temalar), "Sınırlılıklar".',
      en: 'Write these sections: "Methods" (subsections: Eligibility criteria; Information sources and record management; Deduplication; Screening process; AI assistance and human verification; Thematic classification if present), "Results" (subsections: Study selection; Overview of included studies; Themes if present), "Limitations".'
    },
    methods: {
      tr: 'Yalnızca "Yöntem" bölümünü yaz (alt başlıklar: Uygunluk ölçütleri; Bilgi kaynakları ve kayıtların yönetimi; Tekrarların ayıklanması; Tarama süreci; Yapay zekâ desteği ve insan doğrulaması; varsa Tematik sınıflandırma).',
      en: 'Write only the "Methods" section (subsections: Eligibility criteria; Information sources and record management; Deduplication; Screening process; AI assistance and human verification; Thematic classification if present).'
    },
    summary: {
      tr: 'Tek bir "Proje özeti" bölümü yaz: 3–5 paragrafta amaç, kaynaklar, tarama süreci ve sayılar, dahil edilen çalışmaların genel görünümü.',
      en: 'Write one "Project summary" section: 3–5 paragraphs on aim, sources, screening process with numbers, and an overview of the included studies.'
    }
  };

  function systemPrompt(lang, kind) {
    const L = lang === 'en' ? 'English' : 'Turkish';
    return `You draft sections of an academic systematic review report in ${L}, using ONLY the JSON facts supplied by the user.
Never invent numbers, databases, search dates, search strings, software, authors or findings that are not in the facts. Where the report needs a detail that is missing (e.g. search date, search string), write a short placeholder in square brackets, e.g. ${lang === 'en' ? '[search date]' : '[arama tarihi]'}.
Formal academic style (APA 7). Report study selection following the PRISMA 2020 statement (Page et al., 2021) and refer to "${lang === 'en' ? 'Figure 1' : 'Şekil 1'}" for the flow diagram and to "${lang === 'en' ? 'Table 1' : 'Tablo 1'}" for criteria, "${lang === 'en' ? 'Table 2' : 'Tablo 2'}" for themes and "${lang === 'en' ? 'Table 3' : 'Tablo 3'}" for included studies; these are added by the tool, do not reproduce them.
Describe the AI assistance transparently: which models, that the model rated each criterion with a verbatim quote and the decision was derived by a fixed rule, and that humans made or verified the decisions (state how many decisions came from AI only if not zero, and treat that as a limitation).
Only mention reviewer agreement, blind screening or themes if they are present in the facts. When you mention an example study, cite its id in square brackets like [R00012].
${KIND[kind][lang === 'en' ? 'en' : 'tr']}
Return JSON only: {"title": string, "sections": [{"heading": string, "level": 2 or 3, "paragraphs": [string]}]}. Paragraphs are plain text without markdown.`;
  }

  const REPORT_SCHEMA = {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING' },
      sections: { type: 'ARRAY', items: { type: 'OBJECT', properties: { heading: { type: 'STRING' }, level: { type: 'INTEGER' }, paragraphs: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['heading', 'level', 'paragraphs'] } }
    },
    required: ['title', 'sections']
  };

  let busy = null;
  async function generate() {
    if (busy) return;
    const f = facts();
    const { m, keys } = Assist.assistModel();
    if (!keys.length) { switchTab('analysis'); return showError(`${m.pool} API anahtarı yok. Analiz sekmesinde anahtar girin.`); }
    if (!el.reportDoc.hidden && el.reportDoc.textContent.trim() && !confirm('Mevcut taslak ve üzerindeki düzenlemeleriniz yeni raporla değiştirilecek. Devam edilsin mi?')) return;
    const lang = el.reportLang.value, kind = el.reportKind.value;
    busy = new AbortController();
    const btn = el.reportGenBtn;
    btn.disabled = true;
    const usage = { input: 0, output: 0, requests: 0 };
    el.reportInfo.textContent = `${m.apiModel} ile yazılıyor… (${f.included_studies_total} dahil edilen çalışma, ${Math.min(120, f.included_studies_total)} tanesi örnek olarak gönderiliyor)`;
    try {
      const data = await Assist.call({ system: systemPrompt(lang, kind), user: JSON.stringify(f), schema: REPORT_SCHEMA, signal: busy.signal, usage });
      if (!data || !Array.isArray(data.sections) || !data.sections.length) throw new Error('Model geçerli bir rapor döndürmedi.');
      await buildDocument(data, lang);
      el.reportInfo.textContent = `Taslak hazır · ${m.apiModel} · ~${formatTokens(usage.input + usage.output)} token. Metni doğrudan düzenleyebilirsiniz.`;
    } catch (e) {
      el.reportInfo.textContent = '';
      showError('Rapor oluşturulamadı: ' + e.message);
    } finally {
      busy = null;
      btn.disabled = false;
    }
  }

  function h(tag, txt, cls) { const n = document.createElement(tag); if (txt !== undefined) n.textContent = txt; if (cls) n.className = cls; return n; }

  function tableNode(headers, rows) {
    const t = document.createElement('table');
    t.className = 'report-table';
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    headers.forEach(x => tr.appendChild(h('th', x)));
    thead.appendChild(tr);
    const tb = document.createElement('tbody');
    rows.forEach(r => { const row = document.createElement('tr'); r.forEach(c => row.appendChild(h('td', String(c ?? '')))); tb.appendChild(row); });
    t.append(thead, tb);
    return t;
  }

  async function buildDocument(data, lang) {
    const en = lang === 'en';
    const doc = el.reportDoc;
    doc.textContent = '';
    doc.appendChild(h('h1', data.title || (en ? 'Systematic review report' : 'Sistematik derleme raporu')));
    doc.appendChild(h('p', `${WS.isCloud ? WS.project.name : (run && run.fileName) || ''} · ${new Date().toLocaleDateString(en ? 'en-GB' : 'tr-TR')} · ${en ? 'draft generated with AI assistance; verify every statement' : 'yapay zekâ desteğiyle üretilmiş taslaktır; her ifadeyi doğrulayın'}`, 'report-meta'));
    data.sections.forEach(s => {
      doc.appendChild(h(Number(s.level) === 3 ? 'h3' : 'h2', String(s.heading || '')));
      (Array.isArray(s.paragraphs) ? s.paragraphs : []).forEach(p => doc.appendChild(h('p', String(p))));
    });
    // figure and tables: built from the data, not by the model
    doc.appendChild(h('h2', en ? 'Figures and tables' : 'Şekil ve tablolar'));
    const fig = document.createElement('figure');
    fig.className = 'report-fig';
    fig.contentEditable = 'false';
    const img = document.createElement('img');
    img.dataset.fig = 'prisma';
    img.alt = 'PRISMA 2020';
    img.src = (await prismaPngBlob(2)).dataUrl;
    fig.appendChild(img);
    doc.appendChild(fig);
    doc.appendChild(h('p', en ? 'Figure 1. PRISMA 2020 flow diagram (Page et al., 2021).' : 'Şekil 1. PRISMA 2020 akış şeması (Page vd., 2021).', 'caption'));
    const crit = WS.criteria;
    doc.appendChild(h('p', en ? 'Table 1. Eligibility criteria' : 'Tablo 1. Uygunluk ölçütleri', 'caption'));
    doc.appendChild(tableNode([en ? 'Code' : 'Kod', en ? 'Criterion' : 'Ölçüt'], [...crit.inclusion, ...crit.exclusion].map(c => [c.code, c.text])));
    doc.appendChild(h('p', `${en ? 'Inclusion logic' : 'Dahil etme mantığı'}: ${icLogicText(crit, protocolOf().options || {})}. ${en ? 'Any exclusion criterion met excludes a record.' : 'Herhangi bir hariç tutma ölçütü karşılanırsa kayıt hariç tutulur.'}`, 'report-note'));
    const incl = includedStudies();
    const themeDist = new Map();
    incl.forEach(r => Assist.effectiveThemes(r).forEach((t, i) => { const x = themeDist.get(t) || [0, 0]; x[i ? 1 : 0]++; themeDist.set(t, x); }));
    if (themeDist.size) {
      doc.appendChild(h('p', en ? 'Table 2. Theme distribution among included studies' : 'Tablo 2. Dahil edilen çalışmalarda tema dağılımı', 'caption'));
      doc.appendChild(tableNode([en ? 'Theme' : 'Tema', en ? 'Primary' : 'Birincil', en ? 'Secondary' : 'İkincil'], [...themeDist].sort((a, b) => b[1][0] - a[1][0]).map(([t, [p, s]]) => [t, p, s])));
    }
    doc.appendChild(h('p', `${en ? 'Table' : 'Tablo'} ${themeDist.size ? 3 : 2}. ${en ? 'Included studies' : 'Dahil edilen çalışmalar'} (n = ${incl.length})`, 'caption'));
    doc.appendChild(tableNode(['#', en ? 'Author(s)' : 'Yazar(lar)', en ? 'Year' : 'Yıl', en ? 'Title' : 'Başlık', en ? 'Theme' : 'Tema', 'ID'],
      incl.map((r, i) => [i + 1, shortAuthors(r.Authors), r.Year, r.Title, Assist.effectiveThemes(r).join('; '), r.rid])));
    doc.hidden = false;
    el.reportToolbar.hidden = false;
    el.reportDocxBtn.disabled = false;
    el.reportClearBtn.disabled = false;
    saveDraft();
  }

  const saveDraft = debounce(() => {
    if (el.reportDoc.hidden) return;
    Assist.lsSet(lsKey('report'), el.reportDoc.innerHTML);
    el.reportSaved.textContent = `Taslak kaydedildi · ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  }, 800);

  function loadDraft() {
    const html = Assist.lsGet(lsKey('report'), '');
    const doc = el.reportDoc;
    doc.dataset.src = Assist.projectKey();
    if (!html) { doc.textContent = ''; doc.hidden = true; el.reportToolbar.hidden = true; el.reportDocxBtn.disabled = true; el.reportClearBtn.disabled = true; el.reportSaved.textContent = ''; return; }
    // the draft was produced by this page; keep only the tags the editor uses
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    tpl.content.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach(n => n.remove());
    tpl.content.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => { if (/^on/i.test(a.name) || (a.name === 'src' && !/^data:image\/png;base64,/.test(a.value))) n.removeAttribute(a.name); }));
    doc.textContent = '';
    doc.appendChild(tpl.content);
    doc.hidden = false;
    el.reportToolbar.hidden = false;
    el.reportDocxBtn.disabled = false;
    el.reportClearBtn.disabled = false;
    el.reportSaved.textContent = 'Kayıtlı taslak yüklendi.';
    updateReportFigure();
  }

  let figTimer = null;
  function updateReportFigure() {
    const img = el.reportDoc.querySelector('img[data-fig="prisma"]');
    if (!img) return;
    clearTimeout(figTimer);
    figTimer = setTimeout(async () => { img.src = (await prismaPngBlob(2)).dataUrl; saveDraft(); }, 400);
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = () => rej(new Error('Word kütüphanesi yüklenemedi (internet bağlantısını kontrol edin).'));
      document.head.appendChild(s);
    });
  }

  async function exportDocx() {
    const btn = el.reportDocxBtn;
    btn.disabled = true;
    try {
      if (!window.docx) await loadScript(DOCX_URL);
      const D = window.docx;
      const img = el.reportDoc.querySelector('img[data-fig="prisma"]');
      if (img) img.src = (await prismaPngBlob(2)).dataUrl;
      const runs = (node, fmt = {}) => {
        const out = [];
        node.childNodes.forEach(ch => {
          if (ch.nodeType === 3) { if (ch.textContent) out.push(new D.TextRun({ text: ch.textContent, bold: fmt.b, italics: fmt.i })); }
          else if (ch.nodeType === 1) {
            const t = ch.tagName;
            if (t === 'BR') out.push(new D.TextRun({ text: '', break: 1 }));
            else out.push(...runs(ch, { b: fmt.b || t === 'B' || t === 'STRONG' || /font-weight:\s*(bold|[6-9]00)/.test(ch.getAttribute('style') || ''), i: fmt.i || t === 'I' || t === 'EM' }));
          }
        });
        return out;
      };
      const children = [];
      for (const n of el.reportDoc.children) {
        const t = n.tagName;
        if (t === 'H1') children.push(new D.Paragraph({ heading: D.HeadingLevel.TITLE, children: runs(n) }));
        else if (t === 'H2') children.push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, children: runs(n) }));
        else if (t === 'H3') children.push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, children: runs(n) }));
        else if (t === 'UL' || t === 'OL') n.querySelectorAll('li').forEach(li => children.push(new D.Paragraph({ children: runs(li), bullet: { level: 0 } })));
        else if (t === 'FIGURE') {
          const im = n.querySelector('img');
          if (!im || !/^data:image\/png/.test(im.src)) continue;
          const bytes = new Uint8Array(await (await fetch(im.src)).arrayBuffer());
          const w = 620, ratio = (im.naturalHeight || 1) / (im.naturalWidth || 1);
          children.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.ImageRun({ type: 'png', data: bytes, transformation: { width: w, height: Math.round(w * ratio) } })] }));
        } else if (t === 'TABLE') {
          const rows = [...n.querySelectorAll('tr')].map((tr, ri) => new D.TableRow({
            tableHeader: ri === 0,
            children: [...tr.children].map(td => new D.TableCell({ children: [new D.Paragraph({ children: runs(td, { b: td.tagName === 'TH' }) })] }))
          }));
          children.push(new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, rows }));
          children.push(new D.Paragraph({ children: [] }));
        } else {
          const cap = n.classList.contains('caption');
          children.push(new D.Paragraph({ children: runs(n, { i: cap || n.classList.contains('report-meta') }), spacing: { after: 160 }, alignment: cap ? D.AlignmentType.LEFT : D.AlignmentType.JUSTIFIED }));
        }
      }
      const title = (el.reportDoc.querySelector('h1') || {}).textContent || 'Rapor';
      const document_ = new D.Document({
        creator: 'Literatür Tarama Çalışma Alanı', title,
        styles: { default: { document: { run: { font: 'Times New Roman', size: 24 }, paragraph: { spacing: { line: 360 } } } } },
        sections: [{ children }]
      });
      const blob = await D.Packer.toBlob(document_);
      triggerDownload(blob, `${fileBase()}_rapor_${localDate()}.docx`);
    } catch (e) {
      showError('Word dosyası oluşturulamadı: ' + e.message);
    } finally {
      btn.disabled = false;
    }
  }

  // ------------------------------------------------------------
  // Wiring
  // ------------------------------------------------------------
  function render() {
    const has = WS.hasData();
    el.reportEmpty.hidden = has;
    el.reportBody.hidden = !has;
    if (!has) return;
    if (el.reportDoc.dataset.src !== Assist.projectKey()) loadDraft();
    renderPrisma();
    refreshIcons();
  }

  function init() {
    el.prismaLang.addEventListener('change', renderPrisma);
    el.prismaResetBtn.addEventListener('click', () => { if (confirm('PRISMA\'da elle girdiğiniz tüm sayılar silinip hesaplanan değerlere dönülsün mü?')) { saveEdits({}); renderPrisma(); } });
    el.prismaSvgBtn.addEventListener('click', () => {
      triggerDownload(new Blob([prismaSvg().svg], { type: 'image/svg+xml' }), `${fileBase()}_PRISMA_2020.svg`);
    });
    el.prismaPngBtn.addEventListener('click', async () => {
      try { triggerDownload((await prismaPngBlob(3)).blob, `${fileBase()}_PRISMA_2020.png`); } catch (e) { showError('PNG oluşturulamadı: ' + e.message); }
    });
    el.reportGenBtn.addEventListener('click', generate);
    el.reportDocxBtn.addEventListener('click', exportDocx);
    el.reportClearBtn.addEventListener('click', () => {
      if (!confirm('Rapor taslağı ve üzerindeki düzenlemeler silinsin mi?')) return;
      Assist.lsSet(lsKey('report'), '');
      el.reportDoc.dataset.src = '';
      loadDraft();
    });
    el.reportProtocolBtn.addEventListener('click', () => downloadProtocolText(WS.isCloud ? WS.project : null));
    el.reportDoc.contentEditable = 'true';
    el.reportDoc.spellcheck = true;
    el.reportDoc.addEventListener('input', saveDraft);
    el.reportToolbar.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });   // keep the text selection
    el.reportToolbar.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.cmd) document.execCommand(b.dataset.cmd);
      if (b.dataset.block) document.execCommand('formatBlock', false, b.dataset.block);
      saveDraft();
    });
  }

  function onWorkspaceChange() { if (!el['tab-report'].hidden) render(); }

  return { init, render, onWorkspaceChange, computed, current };
})();
window.Report = Report;
