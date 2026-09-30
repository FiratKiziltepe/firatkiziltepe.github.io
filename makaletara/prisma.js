// ============================================================
// PRISMA 2020 flow diagram — "new systematic reviews which included
// searches of databases and registers only" (Page et al., BMJ 2021;372:n71).
// Same boxes, wording and layout as the official template, drawn as SVG so it
// can be edited, downloaded (SVG/PNG) and embedded in the Word report.
// Pure functions: usable in the browser (window.Prisma) and in Node tests.
// ============================================================
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Prisma = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TEXT = {
    en: {
      header: 'Identification of studies via databases and registers',
      side: ['Identification', 'Screening', 'Included'],
      identified: 'Records identified from*:',
      databases: 'Databases',
      registers: 'Registers',
      removedBefore: 'Records removed before screening:',
      duplicates: 'Duplicate records removed',
      automation: 'Records marked as ineligible by automation tools',
      otherReasons: 'Records removed for other reasons',
      screened: 'Records screened',
      excluded: 'Records excluded**',
      sought: 'Reports sought for retrieval',
      notRetrieved: 'Reports not retrieved',
      assessed: 'Reports assessed for eligibility',
      reportsExcluded: 'Reports excluded:',
      reason: 'Reason',
      included: 'Studies included in review',
      reportsIncluded: 'Reports of included studies',
      foot1: '*Consider, if feasible to do so, reporting the number of records identified from each database or register searched (rather than the total number across all databases/registers).',
      foot2: '**If automation tools were used, indicate how many records were excluded by a human and how many were excluded by automation tools.',
      source: 'From: Page MJ, McKenzie JE, Bossuyt PM, Boutron I, Hoffmann TC, Mulrow CD, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ 2021;372:n71. doi: 10.1136/bmj.n71. For more information, visit: http://www.prisma-statement.org/',
      human: 'by a human', automated: 'by automation tools'
    },
    tr: {
      header: 'Veri tabanları ve kayıt sistemleri aracılığıyla çalışmaların belirlenmesi',
      side: ['Belirleme', 'Tarama', 'Dahil etme'],
      identified: 'Belirlenen kayıtlar*:',
      databases: 'Veri tabanları',
      registers: 'Kayıt sistemleri',
      removedBefore: 'Taramadan önce çıkarılan kayıtlar:',
      duplicates: 'Çıkarılan tekrar kayıtlar',
      automation: 'Otomasyon araçlarıyla uygun değil olarak işaretlenen kayıtlar',
      otherReasons: 'Diğer nedenlerle çıkarılan kayıtlar',
      screened: 'Taranan kayıtlar',
      excluded: 'Hariç tutulan kayıtlar**',
      sought: 'Erişilmeye çalışılan raporlar',
      notRetrieved: 'Erişilemeyen raporlar',
      assessed: 'Uygunluk açısından değerlendirilen raporlar',
      reportsExcluded: 'Hariç tutulan raporlar:',
      reason: 'Neden',
      included: 'Derlemeye dahil edilen çalışmalar',
      reportsIncluded: 'Dahil edilen çalışmaların raporları',
      foot1: '*Mümkünse, toplam yerine taranan her veri tabanından ya da kayıt sisteminden belirlenen kayıt sayısını ayrı ayrı bildirin.',
      foot2: '**Otomasyon araçları kullanıldıysa, kaç kaydın bir insan tarafından, kaçının otomasyon araçlarıyla hariç tutulduğunu belirtin.',
      source: 'Kaynak: Page MJ, McKenzie JE, Bossuyt PM, Boutron I, Hoffmann TC, Mulrow CD, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ 2021;372:n71. doi: 10.1136/bmj.n71. Ayrıntı: http://www.prisma-statement.org/',
      human: 'insan tarafından', automated: 'otomasyon araçlarıyla'
    }
  };

  let locale = 'en-US';
  const num = v => (v === null || v === undefined || v === '' || !isFinite(v) ? '' : Number(v).toLocaleString(locale));
  // non-breaking spaces keep "(n = 12)" on one line when a box wraps
  const NB = '\u00A0';
  const n = v => `(n${NB}=${NB}${num(v)})`;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /** Word wrap by an average glyph width (no DOM needed). */
  function wrap(line, maxChars) {
    const words = String(line).split(/[ \t\r\n]+/).filter(Boolean);   // not \s: it would split non-breaking spaces
    const out = [];
    let cur = '';
    words.forEach(w => {
      if (!cur) cur = w;
      else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
      else { out.push(cur); cur = w; }
    });
    if (cur) out.push(cur);
    return out.length ? out : [''];
  }

  /**
   * data: { sources:[{label,n}], registers, duplicates, automation, otherRemoved, screened,
   *         excluded, excludedHuman, excludedAuto, sought, notRetrieved, assessed,
   *         reasons:[{label,n}], included, reportsIncluded }
   * lang: 'en' | 'tr'. Returns { svg, width, height }.
   */
  function flowSvg(data, lang) {
    const T = TEXT[lang] || TEXT.en;
    locale = lang === 'tr' ? 'tr-TR' : 'en-US';
    const W = 920, SIDE_X = 12, SIDE_W = 34, L = 66, LW = 380, R = 526, RW = 380, PAD = 12, LH = 17, FS = 13;
    const chars = w => Math.floor((w - 2 * PAD) / 6.9);
    const blocks = [];   // { x, y, w, h, lines:[{t, bold, indent}] }
    const sources = (data.sources || []).filter(s => s && s.label);
    const dbTotal = sources.reduce((s, x) => s + (Number(x.n) || 0), 0);

    const box = (x, w, lines) => {
      const out = [];
      lines.forEach(l => wrap(l.t, chars(w) - (l.indent ? 3 : 0)).forEach((t, i) => out.push({ t, bold: l.bold && i === 0, indent: l.indent })));
      return { x, w, lines: out, h: out.length * LH + 2 * PAD };
    };
    const excludedLine = [{ t: `${T.excluded} ${n(data.excluded)}` }];
    if (data.excludedAuto) {
      excludedLine.push({ t: `${num(data.excludedHuman)} ${T.human}`, indent: true }, { t: `${num(data.excludedAuto)} ${T.automated}`, indent: true });
    }
    const reasons = (data.reasons || []).filter(r => r && (r.label || r.n));
    const rows = [
      [box(L, LW, [
        { t: T.identified },
        { t: `${T.databases} ${n(sources.length ? dbTotal : data.databases)}` },
        ...sources.map(s => ({ t: `${s.label} ${n(s.n)}`, indent: true })),
        { t: `${T.registers} ${n(data.registers || 0)}` }
      ]), box(R, RW, [
        { t: T.removedBefore },
        { t: `${T.duplicates} ${n(data.duplicates)}`, indent: true },
        { t: `${T.automation} ${n(data.automation || 0)}`, indent: true },
        { t: `${T.otherReasons} ${n(data.otherRemoved || 0)}`, indent: true }
      ])],
      [box(L, LW, [{ t: `${T.screened} ${n(data.screened)}` }]), box(R, RW, excludedLine)],
      [box(L, LW, [{ t: `${T.sought} ${n(data.sought)}` }]), box(R, RW, [{ t: `${T.notRetrieved} ${n(data.notRetrieved || 0)}` }])],
      [box(L, LW, [{ t: `${T.assessed} ${n(data.assessed)}` }]), box(R, RW, [
        { t: T.reportsExcluded },
        ...(reasons.length ? reasons.map((r, i) => ({ t: `${r.label || `${T.reason} ${i + 1}`} ${n(r.n)}`, indent: true }))
          : [1, 2, 3].map(i => ({ t: `${T.reason} ${i} ${n('')}`, indent: true })))
      ])],
      [box(L, LW, [{ t: `${T.included} ${n(data.included)}` }, { t: `${T.reportsIncluded} ${n(data.reportsIncluded)}` }])]
    ];

    let y = 12;
    const header = { x: L, y, w: R + RW - L, h: 40 };
    y += header.h + 22;
    const GAP = 30;
    rows.forEach(r => {
      const h = Math.max(...r.map(b => b.h));
      r.forEach(b => { b.y = y; b.rowH = h; b.h = r.length > 1 ? h : b.h; blocks.push(b); });
      r.y = y; r.h = h;
      y += h + GAP;
    });
    const footY = y - GAP + 26;
    const foot = [T.foot1, T.foot2, '', T.source].map(t => wrap(t, 150));
    const footLines = foot.reduce((s, f) => s + f.length, 0);
    const H = footY + footLines * 14 + 16;

    const parts = [];
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Arial, Helvetica, sans-serif" font-size="${FS}">`);
    parts.push('<defs><marker id="pa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#000"/></marker></defs>');
    parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>`);
    // header (yellow, rounded) — as in the template
    parts.push(`<rect x="${header.x}" y="${header.y}" width="${header.w}" height="${header.h}" rx="10" fill="#FFC000" stroke="#000" stroke-width="1"/>`);
    parts.push(`<text x="${header.x + header.w / 2}" y="${header.y + header.h / 2 + 5}" text-anchor="middle" font-weight="bold" font-size="14">${esc(T.header)}</text>`);
    // side bars (light blue, rotated labels)
    const sideSpans = [[rows[0].y, rows[0].y + rows[0].h], [rows[1].y, rows[3].y + rows[3].h], [rows[4].y, rows[4].y + rows[4].h]];
    sideSpans.forEach(([a, b], i) => {
      parts.push(`<rect x="${SIDE_X}" y="${a}" width="${SIDE_W}" height="${b - a}" rx="8" fill="#9DC3E6" stroke="#000" stroke-width="1"/>`);
      const cx = SIDE_X + SIDE_W / 2, cy = (a + b) / 2;
      parts.push(`<text x="${cx}" y="${cy}" transform="rotate(-90 ${cx} ${cy})" text-anchor="middle" dominant-baseline="central" font-weight="bold">${esc(T.side[i])}</text>`);
    });
    // boxes
    blocks.forEach(b => {
      parts.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#fff" stroke="#000" stroke-width="1"/>`);
      b.lines.forEach((l, i) => {
        parts.push(`<text x="${b.x + PAD + (l.indent ? 14 : 0)}" y="${b.y + PAD + (i + 1) * LH - 4}"${l.bold ? ' font-weight="bold"' : ''}>${esc(l.t)}</text>`);
      });
    });
    // arrows: down the left column, across to the right column
    const line = (x1, y1, x2, y2) => parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="1.3" marker-end="url(#pa)"/>`);
    rows.forEach((r, i) => {
      const left = r[0];
      if (r[1]) line(left.x + left.w, left.y + left.h / 2, r[1].x - 2, left.y + left.h / 2);
      if (rows[i + 1]) line(left.x + left.w / 2, left.y + left.h, left.x + left.w / 2, rows[i + 1][0].y - 2);
    });
    // footnotes
    let fy = footY;
    foot.forEach(f => f.forEach(t => { parts.push(`<text x="${L}" y="${fy}" font-size="10.5" fill="#333">${esc(t)}</text>`); fy += 14; }));
    parts.push('</svg>');
    return { svg: parts.join(''), width: W, height: H };
  }

  return { TEXT, flowSvg, wrap };
}));
