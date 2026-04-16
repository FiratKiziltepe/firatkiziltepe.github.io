(function (global) {
  "use strict";

  const FIELDS = {
    SIRA: "SIRA NO",
    DERS: "DERS ADI",
    UNITE: "ÜNİTE/TEMA/ ÖĞRENME ALANI",
    KAZANIM: "KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM",
    TUR: "E-İÇERİK TÜRÜ",
    ACIKLAMA: "AÇIKLAMA",
    PROGRAM: "Program Türü",
  };

  function cleanString(value) {
    if (value == null) return "";
    let s = String(value);
    s = s.replace(/\u00a0/g, " ");
    s = s.replace(/\s+/g, " ");
    return s.trim();
  }

  function splitTypes(raw) {
    if (!raw) return [];
    return raw
      .split(/[\/,;]+/)
      .map((t) => cleanString(t))
      .filter(Boolean);
  }

  function isHeaderRow(row) {
    return (
      row[FIELDS.DERS] === "DERS ADI" ||
      row[FIELDS.PROGRAM] === "Program Türü" ||
      row[FIELDS.TUR] === "E-İÇERİK TÜRÜ"
    );
  }

  function normalizeRow(row, idx) {
    const ders = cleanString(row[FIELDS.DERS]);
    const unite = cleanString(row[FIELDS.UNITE]);
    const kazanim = cleanString(row[FIELDS.KAZANIM]);
    const turRaw = cleanString(row[FIELDS.TUR]);
    const aciklama = cleanString(row[FIELDS.ACIKLAMA]);
    const program = cleanString(row[FIELDS.PROGRAM]);
    const sira = row[FIELDS.SIRA];

    return {
      id: idx,
      sira: typeof sira === "number" ? sira : parseInt(sira, 10) || idx + 1,
      ders,
      unite,
      kazanim,
      tur: turRaw,
      types: splitTypes(turRaw),
      aciklama,
      program,
      _search: [ders, unite, kazanim, turRaw, aciklama, program]
        .join(" \u0001 ")
        .toLocaleLowerCase("tr"),
    };
  }

  let _cache = null;
  let _pending = null;

  async function loadData() {
    if (_cache) return _cache;
    if (_pending) return _pending;

    _pending = (async () => {
      const res = await fetch("./data.json", { cache: "force-cache" });
      if (!res.ok) throw new Error("data.json yüklenemedi: " + res.status);
      const raw = await res.json();

      const rows = [];
      for (let i = 0; i < raw.length; i++) {
        const r = raw[i];
        if (!r || typeof r !== "object") continue;
        if (isHeaderRow(r)) continue;
        const n = normalizeRow(r, rows.length);
        if (!n.ders) continue;
        rows.push(n);
      }

      const dersSet = new Set();
      const programSet = new Set();
      const turSetRaw = new Set();
      const turSetSplit = new Set();
      for (const row of rows) {
        if (row.ders) dersSet.add(row.ders);
        if (row.program) programSet.add(row.program);
        if (row.tur) turSetRaw.add(row.tur);
        for (const t of row.types) turSetSplit.add(t);
      }

      const collator = new Intl.Collator("tr", { sensitivity: "base" });
      const dersler = Array.from(dersSet).sort(collator.compare);
      const programlar = Array.from(programSet).sort(collator.compare);
      const turlerRaw = Array.from(turSetRaw).sort(collator.compare);
      const turlerSplit = Array.from(turSetSplit).sort(collator.compare);

      _cache = {
        rows,
        dersler,
        programlar,
        turlerRaw,
        turlerSplit,
        total: rows.length,
      };
      return _cache;
    })();

    try {
      return await _pending;
    } finally {
      _pending = null;
    }
  }

  global.EtabloData = {
    load: loadData,
    FIELDS,
    cleanString,
    splitTypes,
  };
})(window);
