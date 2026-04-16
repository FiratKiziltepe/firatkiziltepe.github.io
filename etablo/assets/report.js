(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const collator = new Intl.Collator("tr", { sensitivity: "base" });

  const state = {
    data: null,
    programs: [],
    dersPivot: [],
    turSearch: "",
    dersSearch: "",
    turMode: "split",
  };

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), ms);
    };
  }

  // ---------------- Pivot 1: Ders × Program ----------------
  function buildDersPivot() {
    const rows = state.data.rows;
    const programsSet = new Set(state.data.programlar);
    const programs = Array.from(programsSet).sort((a, b) => {
      if (a === "Diğer") return -1;
      if (b === "Diğer") return 1;
      return collator.compare(a, b);
    });

    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.ders)) {
        const row = { ders: r.ders, counts: {}, total: 0 };
        for (const p of programs) row.counts[p] = 0;
        map.set(r.ders, row);
      }
      const row = map.get(r.ders);
      if (r.program && Object.prototype.hasOwnProperty.call(row.counts, r.program)) {
        row.counts[r.program]++;
      }
      row.total++;
    }

    const list = Array.from(map.values()).sort((a, b) => collator.compare(a.ders, b.ders));
    list.forEach((r, i) => (r.sira = i + 1));
    state.programs = programs;
    state.dersPivot = list;
  }

  function renderDersTable() {
    const host = $("ders-table");
    const q = state.dersSearch.trim().toLocaleLowerCase("tr");
    const programs = state.programs;

    const list = q
      ? state.dersPivot.filter((r) => r.ders.toLocaleLowerCase("tr").includes(q))
      : state.dersPivot;

    let html = `<table><thead><tr>
      <th class="num">SIRA NO</th>
      <th>DERS ADI</th>`;
    for (const p of programs) {
      html += `<th class="num">${escapeHtml((p || "-").toLocaleUpperCase("tr"))}</th>`;
    }
    html += `<th class="num">GENEL TOPLAM</th></tr></thead><tbody>`;

    const totals = {};
    for (const p of programs) totals[p] = 0;
    let grand = 0;

    for (const r of list) {
      html += `<tr>
        <td class="num">${r.sira}</td>
        <td>${escapeHtml(r.ders)}</td>`;
      for (const p of programs) {
        const v = r.counts[p] || 0;
        totals[p] += v;
        html += `<td class="num">${v === 0 ? "" : v}</td>`;
      }
      html += `<td class="num"><strong>${r.total}</strong></td></tr>`;
      grand += r.total;
    }

    html += `<tr style="background:var(--meb-blue-light);">
      <td></td><td><strong>TOPLAM</strong></td>`;
    for (const p of programs) {
      html += `<td class="num"><strong>${totals[p] || 0}</strong></td>`;
    }
    html += `<td class="num"><strong>${grand}</strong></td></tr>`;
    html += `</tbody></table>`;

    host.innerHTML = html;

    $("ders-count").textContent = state.dersPivot.length.toLocaleString("tr");
    $("ders-total").textContent = grand.toLocaleString("tr");
  }

  // ---------------- Pivot 2: E-İçerik Türü ----------------
  function computeTurCounts(mode) {
    const counter = new Map();
    for (const r of state.data.rows) {
      if (mode === "split") {
        for (const t of r.types) {
          counter.set(t, (counter.get(t) || 0) + 1);
        }
      } else {
        if (!r.tur) continue;
        counter.set(r.tur, (counter.get(r.tur) || 0) + 1);
      }
    }
    const list = Array.from(counter.entries()).map(([tur, count]) => ({ tur, count }));
    list.sort((a, b) => b.count - a.count || collator.compare(a.tur, b.tur));
    return list;
  }

  function renderTurTable() {
    const host = $("tur-table");
    const full = computeTurCounts(state.turMode);
    const q = state.turSearch.trim().toLocaleLowerCase("tr");
    const list = q ? full.filter((r) => r.tur.toLocaleLowerCase("tr").includes(q)) : full;

    let html = `<table><thead><tr>
      <th class="num" style="width:80px;">#</th>
      <th>E-İÇERİK TÜRÜ</th>
      <th class="num" style="width:140px;">ADET</th>
    </tr></thead><tbody>`;

    let total = 0;
    list.forEach((r, i) => {
      total += r.count;
      html += `<tr>
        <td class="num">${i + 1}</td>
        <td>${escapeHtml(r.tur)}</td>
        <td class="num">${r.count.toLocaleString("tr")}</td>
      </tr>`;
    });
    const fullTotal = full.reduce((s, r) => s + r.count, 0);
    html += `<tr style="background:var(--meb-blue-light);">
      <td></td>
      <td><strong>TOPLAM${q ? " (filtrelenmiş)" : ""}</strong></td>
      <td class="num"><strong>${total.toLocaleString("tr")}</strong></td>
    </tr>`;
    html += `</tbody></table>`;
    host.innerHTML = html;

    $("tur-count").textContent = full.length.toLocaleString("tr");
    $("tur-total").textContent = fullTotal.toLocaleString("tr");
  }

  // ---------------- CSV ----------------
  function toCsv(rows) {
    return rows
      .map((r) =>
        r
          .map((c) => {
            const s = String(c == null ? "" : c);
            return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(";")
      )
      .join("\n");
  }

  function download(filename, content) {
    const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function exportDersCsv() {
    const rows = [["SIRA NO", "DERS ADI", ...state.programs.map((p) => p.toLocaleUpperCase("tr")), "GENEL TOPLAM"]];
    for (const r of state.dersPivot) {
      const line = [r.sira, r.ders];
      for (const p of state.programs) line.push(r.counts[p] || 0);
      line.push(r.total);
      rows.push(line);
    }
    download("ders-program-ozeti.csv", toCsv(rows));
  }

  function exportTurCsv() {
    const full = computeTurCounts(state.turMode);
    const rows = [["#", "E-İÇERİK TÜRÜ", "ADET"]];
    full.forEach((r, i) => rows.push([i + 1, r.tur, r.count]));
    const name = state.turMode === "split" ? "e-icerik-turu-ayristirilmis.csv" : "e-icerik-turu-ham.csv";
    download(name, toCsv(rows));
  }

  // ---------------- Init ----------------
  async function init() {
    try {
      const data = await EtabloData.load();
      state.data = data;
      buildDersPivot();
      renderDersTable();
      renderTurTable();

      $("ders-search").addEventListener("input", debounce((e) => {
        state.dersSearch = e.target.value;
        renderDersTable();
      }, 120));

      $("tur-search").addEventListener("input", debounce((e) => {
        state.turSearch = e.target.value;
        renderTurTable();
      }, 120));

      const segButtons = document.querySelectorAll(".segmented button");
      segButtons.forEach((b) => {
        b.addEventListener("click", () => {
          segButtons.forEach((x) => x.classList.remove("active"));
          b.classList.add("active");
          state.turMode = b.dataset.mode;
          renderTurTable();
        });
      });

      $("export-t1").addEventListener("click", exportDersCsv);
      $("export-t2").addEventListener("click", exportTurCsv);
    } catch (err) {
      $("ders-table").innerHTML = `<div class="alert">Veri yüklenemedi: ${escapeHtml(err.message)}</div>`;
      $("tur-table").innerHTML = "";
      console.error(err);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
