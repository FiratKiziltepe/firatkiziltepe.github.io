(function () {
  "use strict";

  const state = {
    data: null,
    selectedDersler: new Set(),
    program: "",
    query: "",
    pageSize: 25,
    page: 1,
    filtered: [],
    sorts: [],
  };

  const SORTABLE = {
    ders: (r) => r.ders,
    program: (r) => r.program,
  };

  const $ = (id) => document.getElementById(id);
  const collator = new Intl.Collator("tr", { sensitivity: "base" });

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlight(text, query) {
    const safe = escapeHtml(text);
    if (!query) return safe;
    const trimmed = query.trim();
    if (!trimmed) return safe;
    const re = new RegExp(escapeRegex(trimmed), "giu");
    return safe.replace(re, (m) => `<mark class="hl">${m}</mark>`);
  }

  function formatAciklama(text, query) {
    if (!text) return "";
    const parts = text
      .split(/(?<=hazırlanır\.)\s+/giu)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length <= 1) return highlight(text, query);
    return parts.map((p) => `<p>${highlight(p, query)}</p>`).join("");
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), ms);
    };
  }

  // ---------------- Multi-select (Ders Adı) ----------------
  const multi = {
    el: null,
    trigger: null,
    panel: null,
    listEl: null,
    searchEl: null,
    allOptions: [],
    filterText: "",
  };

  function initMulti() {
    multi.el = $("ders-multi");
    multi.trigger = $("ders-trigger");
    multi.panel = multi.el.querySelector(".multi-panel");
    multi.listEl = $("ders-list");
    multi.searchEl = $("ders-search");

    multi.trigger.addEventListener("click", toggleMulti);
    multi.trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleMulti();
      }
    });
    document.addEventListener("click", (e) => {
      if (!multi.el.contains(e.target)) closeMulti();
    });
    multi.searchEl.addEventListener("input", (e) => {
      multi.filterText = e.target.value.toLocaleLowerCase("tr");
      renderMultiList();
    });
    $("ders-all").addEventListener("click", () => {
      const visibleDersler = getVisibleDersOptions();
      for (const d of visibleDersler) state.selectedDersler.add(d);
      renderMultiTrigger();
      renderMultiList();
      onFilterChange();
    });
    $("ders-clear").addEventListener("click", () => {
      state.selectedDersler.clear();
      renderMultiTrigger();
      renderMultiList();
      onFilterChange();
    });
  }

  function getVisibleDersOptions() {
    if (!multi.filterText) return multi.allOptions;
    return multi.allOptions.filter((d) =>
      d.toLocaleLowerCase("tr").includes(multi.filterText)
    );
  }

  function toggleMulti() {
    multi.el.classList.contains("open") ? closeMulti() : openMulti();
  }
  function openMulti() {
    multi.el.classList.add("open");
    multi.trigger.setAttribute("aria-expanded", "true");
    setTimeout(() => multi.searchEl.focus(), 0);
  }
  function closeMulti() {
    multi.el.classList.remove("open");
    multi.trigger.setAttribute("aria-expanded", "false");
  }

  function renderMultiTrigger() {
    multi.trigger.innerHTML = "";
    if (state.selectedDersler.size === 0) {
      const span = document.createElement("span");
      span.className = "placeholder";
      span.textContent = "Tüm dersler";
      multi.trigger.appendChild(span);
      return;
    }
    const arr = Array.from(state.selectedDersler).sort(collator.compare);
    const maxShow = 3;
    const shown = arr.slice(0, maxShow);
    for (const name of shown) {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.innerHTML = `<span>${escapeHtml(name)}</span><button type="button" aria-label="Kaldır">×</button>`;
      chip.querySelector("button").addEventListener("click", (e) => {
        e.stopPropagation();
        state.selectedDersler.delete(name);
        renderMultiTrigger();
        renderMultiList();
        onFilterChange();
      });
      multi.trigger.appendChild(chip);
    }
    if (arr.length > maxShow) {
      const more = document.createElement("span");
      more.className = "chip";
      more.textContent = `+${arr.length - maxShow}`;
      multi.trigger.appendChild(more);
    }
  }

  function renderMultiList() {
    const items = getVisibleDersOptions();
    if (items.length === 0) {
      multi.listEl.innerHTML = `<div class="empty">Sonuç yok</div>`;
      return;
    }
    const frag = document.createDocumentFragment();
    for (const name of items) {
      const label = document.createElement("label");
      label.className = "multi-option";
      const checked = state.selectedDersler.has(name) ? "checked" : "";
      label.innerHTML = `<input type="checkbox" ${checked} /><span>${escapeHtml(name)}</span>`;
      const cb = label.querySelector("input");
      cb.addEventListener("change", () => {
        if (cb.checked) state.selectedDersler.add(name);
        else state.selectedDersler.delete(name);
        renderMultiTrigger();
        onFilterChange();
      });
      frag.appendChild(label);
    }
    multi.listEl.innerHTML = "";
    multi.listEl.appendChild(frag);
  }

  // ---------------- Filtering ----------------
  function applyFilters() {
    const rows = state.data.rows;
    const hasDers = state.selectedDersler.size > 0;
    const program = state.program;
    const q = state.query.trim().toLocaleLowerCase("tr");

    const out = [];
    for (const r of rows) {
      if (hasDers && !state.selectedDersler.has(r.ders)) continue;
      if (program && r.program !== program) continue;
      if (q && !r._search.includes(q)) continue;
      out.push(r);
    }

    if (state.sorts.length > 0) {
      out.sort((a, b) => {
        for (const s of state.sorts) {
          const getter = SORTABLE[s.key];
          if (!getter) continue;
          const va = getter(a) || "";
          const vb = getter(b) || "";
          const c = collator.compare(va, vb);
          if (c !== 0) return c * (s.dir === "desc" ? -1 : 1);
        }
        return a.id - b.id;
      });
    }

    state.filtered = out;
    state.page = 1;
  }

  function onFilterChange() {
    applyFilters();
    render();
  }

  // ---------------- Rendering table ----------------
  function renderTable() {
    const host = $("table-host");
    const total = state.filtered.length;
    if (total === 0) {
      host.innerHTML = `<div class="loader">Filtrelere uygun içerik bulunamadı.</div>`;
      return;
    }

    const ps = state.pageSize;
    const pages = Math.max(1, Math.ceil(total / ps));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * ps;
    const slice = state.filtered.slice(start, start + ps);

    const sortIndex = (key) => state.sorts.findIndex((s) => s.key === key);
    const sortClass = (key) => {
      const i = sortIndex(key);
      return i >= 0 ? ` sort-${state.sorts[i].dir}` : "";
    };
    const arrow = (key) => {
      const i = sortIndex(key);
      if (i < 0) return "↕";
      const dir = state.sorts[i].dir === "asc" ? "▲" : "▼";
      const badge = state.sorts.length > 1 ? `<sup>${i + 1}</sup>` : "";
      return dir + badge;
    };

    let html = `<div class="table-wrap"><table>
      <colgroup>
        <col class="c-sira">
        <col class="c-ders">
        <col class="c-unite">
        <col class="c-kazanim">
        <col class="c-tur">
        <col>
        <col class="c-program">
      </colgroup>
      <thead><tr>
        <th class="num">SIRA NO</th>
        <th class="sortable${sortClass("ders")}" data-sort="ders" title="Sıralamak için tıklayın. Shift+Tık ile ikincil sıralama eklersiniz.">DERS ADI<span class="arrow">${arrow("ders")}</span></th>
        <th>ÜNİTE/TEMA/ÖĞRENME ALANI</th>
        <th>KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM</th>
        <th>E-İÇERİK TÜRÜ</th>
        <th>AÇIKLAMA</th>
        <th class="center sortable${sortClass("program")}" data-sort="program" title="Sıralamak için tıklayın. Shift+Tık ile ikincil sıralama eklersiniz.">PROGRAM TÜRÜ<span class="arrow">${arrow("program")}</span></th>
      </tr></thead><tbody>`;
    const q = state.query.trim();
    for (const r of slice) {
      const badgeClass = r.program === "TYMM" ? "tymm" : r.program === "Diğer" ? "diger" : "";
      html += `<tr>
        <td class="num">${escapeHtml(r.sira)}</td>
        <td>${highlight(r.ders, q)}</td>
        <td>${highlight(r.unite, q)}</td>
        <td>${highlight(r.kazanim, q)}</td>
        <td>${highlight(r.tur, q)}</td>
        <td class="multiline">${formatAciklama(r.aciklama, q)}</td>
        <td class="center"><span class="badge ${badgeClass}">${escapeHtml(r.program || "-")}</span></td>
      </tr>`;
    }
    html += `</tbody></table></div>`;
    host.innerHTML = html;

    host.querySelectorAll("th.sortable").forEach((th) => {
      th.addEventListener("click", (e) => {
        const key = th.dataset.sort;
        const idx = state.sorts.findIndex((s) => s.key === key);
        if (e.shiftKey) {
          if (idx >= 0) {
            state.sorts[idx].dir = state.sorts[idx].dir === "asc" ? "desc" : "asc";
          } else {
            state.sorts.push({ key, dir: "asc" });
          }
        } else {
          if (idx >= 0 && state.sorts.length === 1) {
            state.sorts = [{ key, dir: state.sorts[0].dir === "asc" ? "desc" : "asc" }];
          } else {
            state.sorts = [{ key, dir: "asc" }];
          }
        }
        applyFilters();
        render();
      });
    });
  }

  function renderPagination() {
    const total = state.filtered.length;
    const ps = state.pageSize;
    const pages = Math.max(1, Math.ceil(total / ps));
    const cur = Math.min(state.page, pages);

    const info = $("page-info");
    const start = total === 0 ? 0 : (cur - 1) * ps + 1;
    const end = Math.min(total, cur * ps);
    info.innerHTML = total === 0
      ? ""
      : `Sayfa <strong>${cur}</strong> / ${pages} &middot; ${start}-${end} arası gösteriliyor`;

    const pag = $("pagination");
    pag.innerHTML = "";
    if (pages <= 1) return;

    const mk = (label, page, opts = {}) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      if (opts.active) b.classList.add("active");
      if (opts.disabled) b.disabled = true;
      b.addEventListener("click", () => {
        state.page = page;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      return b;
    };
    const dots = () => {
      const s = document.createElement("span");
      s.className = "dots";
      s.textContent = "…";
      return s;
    };

    pag.appendChild(mk("‹ Önceki", Math.max(1, cur - 1), { disabled: cur === 1 }));

    const win = 1;
    const nums = new Set([1, pages, cur, cur - 1, cur + 1]);
    for (let i = -win; i <= win; i++) nums.add(cur + i);
    const arr = Array.from(nums).filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
    let prev = 0;
    for (const n of arr) {
      if (n - prev > 1) pag.appendChild(dots());
      pag.appendChild(mk(String(n), n, { active: n === cur }));
      prev = n;
    }

    pag.appendChild(mk("Sonraki ›", Math.min(pages, cur + 1), { disabled: cur === pages }));
  }

  function renderCounters() {
    $("count-total").textContent = state.data.total.toLocaleString("tr");
    $("count-visible").textContent = state.filtered.length.toLocaleString("tr");
  }

  function render() {
    renderCounters();
    renderTable();
    renderPagination();
  }

  // ---------------- Clear filters ----------------
  function clearFilters() {
    state.selectedDersler.clear();
    state.program = "";
    state.query = "";
    state.page = 1;
    state.pageSize = 25;
    state.sorts = [];

    const progSel = $("program-select");
    if (progSel) progSel.value = "";
    const searchEl = $("search-input");
    if (searchEl) searchEl.value = "";
    const pageSizeEl = $("page-size");
    if (pageSizeEl) pageSizeEl.value = "25";
    if (multi.searchEl) multi.searchEl.value = "";
    multi.filterText = "";

    renderMultiTrigger();
    renderMultiList();
    closeMulti();
    onFilterChange();
  }

  // ---------------- Excel export ----------------
  function exportXlsx() {
    if (typeof XLSX === "undefined") {
      alert("Excel kütüphanesi yüklenemedi.");
      return;
    }
    const rows = state.filtered;
    const header = [
      "SIRA NO",
      "DERS ADI",
      "ÜNİTE/TEMA/ÖĞRENME ALANI",
      "KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM",
      "E-İÇERİK TÜRÜ",
      "AÇIKLAMA",
      "PROGRAM TÜRÜ",
    ];
    const aoa = [header];
    for (const r of rows) {
      aoa.push([r.sira, r.ders, r.unite, r.kazanim, r.tur, r.aciklama, r.program]);
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [
      { wch: 8 }, { wch: 28 }, { wch: 34 }, { wch: 50 },
      { wch: 28 }, { wch: 60 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "E-İçerik");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `e-icerik-tablosu-${stamp}.xlsx`);
  }

  // ---------------- Init ----------------
  async function init() {
    initMulti();

    $("program-select").addEventListener("change", (e) => {
      state.program = e.target.value;
      onFilterChange();
    });
    $("search-input").addEventListener("input", debounce((e) => {
      state.query = e.target.value;
      onFilterChange();
    }, 150));
    $("page-size").addEventListener("change", (e) => {
      state.pageSize = parseInt(e.target.value, 10) || 25;
      state.page = 1;
      render();
    });

    $("clear-filters").addEventListener("click", clearFilters);
    $("export-xlsx").addEventListener("click", exportXlsx);

    try {
      const data = await EtabloData.load();
      state.data = data;

      multi.allOptions = data.dersler;
      renderMultiList();
      renderMultiTrigger();

      const sel = $("program-select");
      for (const p of data.programlar) {
        const opt = document.createElement("option");
        opt.value = p; opt.textContent = p;
        sel.appendChild(opt);
      }

      applyFilters();
      render();
    } catch (err) {
      $("table-host").innerHTML = `<div class="alert">Veri yüklenemedi: ${escapeHtml(err.message)}</div>`;
      console.error(err);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
