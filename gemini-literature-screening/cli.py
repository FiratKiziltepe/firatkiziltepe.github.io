#!/usr/bin/env python3
"""
Gemini Literature Screening — CLI v1.0
Sync + Async Batch API · Multi-model · Cost panel · Resume · Prompt versioning

Tarayıcıdan bağımsız, terminal-bazlı sistematik literatür tarama aracı.
20K+ makale taraması için tasarlanmıştır.

Kullanım örneği:
    python cli.py \\
        --input articles.xlsx \\
        --output results.xlsx \\
        --inclusion criteria/ic.txt \\
        --exclusion criteria/ec.txt \\
        --model gemini-3.1-flash-lite-preview \\
        --mode async \\
        --api-key $GEMINI_API_KEY
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

try:
    import pandas as pd
except ImportError:
    pd = None  # type: ignore

# ============================================================
# MODEL CATALOG (USD / 1M token, ai.google.dev/gemini-api/docs/pricing)
# ============================================================
MODELS: Dict[str, Dict[str, Any]] = {
    "gemini-3.1-pro-preview": {
        "label": "Gemini 3.1 Pro (Preview)",
        "standard": {"input": 2.00, "output": 12.00},
        "batch":    {"input": 1.00, "output": 6.00},
        "free_tier": False,
        "rpm": 0, "rpd": 0, "tpm": 0,
    },
    "gemini-3.1-flash-lite-preview": {
        "label": "Gemini 3.1 Flash Lite (Preview)",
        "standard": {"input": 0.25, "output": 1.50},
        "batch":    {"input": 0.125, "output": 0.75},
        "free_tier": True,
        "rpm": 15, "rpd": 500, "tpm": 250_000,
    },
    "gemini-2.5-flash": {
        "label": "Gemini 2.5 Flash",
        "standard": {"input": 0.30, "output": 2.50},
        "batch":    {"input": 0.15, "output": 1.25},
        "free_tier": True,
        "rpm": 5, "rpd": 20, "tpm": 250_000,
    },
    "gemini-2.5-flash-lite": {
        "label": "Gemini 2.5 Flash Lite",
        "standard": {"input": 0.10, "output": 0.40},
        "batch":    {"input": 0.05, "output": 0.20},
        "free_tier": True,
        "rpm": 10, "rpd": 20, "tpm": 250_000,
    },
}

API_BASE = "https://generativelanguage.googleapis.com/v1beta"

# ============================================================
# DATA CLASSES
# ============================================================
@dataclass
class Article:
    ID: str
    Title: str
    Abstract: str
    Authors: str = ""
    Year: str = ""

@dataclass
class Result:
    id: str
    authors: str
    title: str
    year: str
    abstract: str
    summary_tr: str
    decision: str
    confidence: Optional[float]
    matched_inclusion_criteria: List[str]
    matched_exclusion_criteria: List[str]
    needs_human_review: bool
    rationale: str

@dataclass
class State:
    model_id: str
    mode: str  # sync | async
    file_hash: str
    total_count: int
    last_processed_batch_index: int = -1
    results: List[Dict[str, Any]] = field(default_factory=list)
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cost_usd: float = 0.0
    batch_job_name: str = ""
    batch_submitted_at: float = 0.0
    batch_last_state: str = ""
    batch_key_map: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    prompt_hash: str = ""

# ============================================================
# I/O HELPERS
# ============================================================
def read_articles(path: Path) -> List[Article]:
    suffix = path.suffix.lower()
    if suffix in {".xlsx", ".xls"}:
        if pd is None:
            sys.exit("Excel okumak için pandas + openpyxl gerekli: pip install -r requirements.txt")
        df = pd.read_excel(path, dtype=str).fillna("")
    elif suffix in {".csv", ".tsv"}:
        if pd is None:
            return _read_csv_stdlib(path)
        sep = "\t" if suffix == ".tsv" else _detect_delimiter(path)
        df = pd.read_csv(path, dtype=str, sep=sep).fillna("")
    else:
        sys.exit(f"Desteklenmeyen dosya türü: {suffix}")

    cols = {c.lower().strip(): c for c in df.columns}
    if "title" not in cols or "abstract" not in cols:
        sys.exit("Dosya 'Title' ve 'Abstract' sütunlarını içermelidir!")
    id_col = cols.get("id")
    au_col = cols.get("authors") or cols.get("author")
    yr_col = next((c for k, c in cols.items() if "year" in k), None)

    articles = []
    for i, row in df.iterrows():
        a = Article(
            ID=str(row[id_col]).strip() if id_col else str(i + 1),
            Title=str(row[cols["title"]]).strip(),
            Abstract=str(row[cols["abstract"]]).strip(),
            Authors=str(row[au_col]).strip() if au_col else "",
            Year=str(row[yr_col]).strip() if yr_col else "",
        )
        if a.Title or a.Abstract:
            articles.append(a)
    return articles


def _detect_delimiter(path: Path) -> str:
    with path.open("r", encoding="utf-8-sig", errors="replace") as f:
        first = f.readline()
    counts = {sep: first.count(sep) for sep in ("\t", ",", ";")}
    return max(counts, key=counts.get)


def _read_csv_stdlib(path: Path) -> List[Article]:
    delim = _detect_delimiter(path)
    articles: List[Article] = []
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as f:
        reader = csv.DictReader(f, delimiter=delim)
        if not reader.fieldnames:
            return []
        cols = {c.lower().strip(): c for c in reader.fieldnames}
        if "title" not in cols or "abstract" not in cols:
            sys.exit("Dosya 'Title' ve 'Abstract' sütunlarını içermelidir!")
        id_col = cols.get("id")
        au_col = cols.get("authors") or cols.get("author")
        yr_col = next((c for k, c in cols.items() if "year" in k), None)
        for i, row in enumerate(reader):
            a = Article(
                ID=(row.get(id_col) or "").strip() if id_col else str(i + 1),
                Title=(row.get(cols["title"]) or "").strip(),
                Abstract=(row.get(cols["abstract"]) or "").strip(),
                Authors=(row.get(au_col) or "").strip() if au_col else "",
                Year=(row.get(yr_col) or "").strip() if yr_col else "",
            )
            if a.Title or a.Abstract:
                articles.append(a)
    return articles


def write_results(results: List[Result], state: State, prompt_text: str,
                  inclusion: List[Dict], exclusion: List[Dict], output: Path) -> None:
    suffix = output.suffix.lower()
    if suffix in {".xlsx", ".xls"}:
        if pd is None:
            sys.exit("Excel yazmak için pandas + openpyxl gerekli")
        _write_excel(results, state, prompt_text, inclusion, exclusion, output)
    else:
        _write_csv(results, state, prompt_text, inclusion, exclusion, output)


def _write_csv(results, state, prompt_text, inclusion, exclusion, output):
    meta = _build_metadata_rows(state, prompt_text, inclusion, exclusion)
    with output.open("w", encoding="utf-8-sig", newline="") as f:
        for k, v in meta:
            f.write(f"# {k}\t{str(v).replace(chr(10), ' ')}\n")
        f.write("#\n")
        writer = csv.writer(f)
        writer.writerow(["ID", "Yazar(lar)", "Başlık", "Yıl", "Abstract (Orijinal)",
                         "Türkçe Özet", "Karar", "Güven", "IC", "EC",
                         "İnceleme", "Gerekçe", "Prompt Versiyon"])
        for r in results:
            writer.writerow([
                r.id, r.authors, r.title, r.year, r.abstract, r.summary_tr,
                r.decision,
                f"{r.confidence:.2f}" if r.confidence is not None else "",
                ";".join(r.matched_inclusion_criteria),
                ";".join(r.matched_exclusion_criteria),
                "Yes" if r.needs_human_review else "No",
                r.rationale,
                state.prompt_hash,
            ])


def _write_excel(results, state, prompt_text, inclusion, exclusion, output):
    df = pd.DataFrame([{
        "ID": r.id, "Yazar(lar)": r.authors, "Başlık": r.title, "Yıl": r.year,
        "Abstract (Orijinal)": r.abstract, "Türkçe Özet": r.summary_tr,
        "Karar": r.decision,
        "Güven": f"{r.confidence:.2f}" if r.confidence is not None else "",
        "IC": ";".join(r.matched_inclusion_criteria),
        "EC": ";".join(r.matched_exclusion_criteria),
        "İnceleme Gerekli": "Yes" if r.needs_human_review else "No",
        "Gerekçe": r.rationale,
        "Prompt Versiyon": state.prompt_hash,
    } for r in results])

    meta_rows = _build_metadata_rows(state, prompt_text, inclusion, exclusion)
    meta_df = pd.DataFrame(meta_rows, columns=["Anahtar", "Değer"])

    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Screening", index=False)
        meta_df.to_excel(writer, sheet_name="Metadata", index=False)


def _build_metadata_rows(state: State, prompt_text: str,
                         inclusion: List[Dict], exclusion: List[Dict]) -> List[List[Any]]:
    m = MODELS[state.model_id]
    tier = "batch" if state.mode == "async" else "standard"
    rows = [
        ["Tarih (UTC)", datetime.now(timezone.utc).isoformat()],
        ["Model", state.model_id],
        ["Model adı", m["label"]],
        ["Mod", state.mode],
        ["Tier", tier],
        ["Prompt versiyon (sha256[0:8])", state.prompt_hash],
        ["Toplam makale", state.total_count],
        ["İşlenen makale", len(state.results)],
        ["Toplam input token", state.total_input_tokens],
        ["Toplam output token", state.total_output_tokens],
        ["Toplam maliyet (USD)", f"{state.total_cost_usd:.6f}"],
        ["Free Tier mevcut", "Evet" if m["free_tier"] else "Hayır"],
        ["", ""],
        ["Dahil etme kriterleri (IC):", ""],
    ]
    rows += [[c["code"], c["text"]] for c in inclusion]
    rows += [["", ""], ["Hariç tutma kriterleri (EC):", ""]]
    rows += [[c["code"], c["text"]] for c in exclusion]
    rows += [["", ""], ["Sistem promptu:", ""], ["", prompt_text]]
    return rows


# ============================================================
# PROMPT BUILDING
# ============================================================
SYSTEM_PROMPT = """Sen bir sistematik literatür tarama inceleme asistanısın.

Kullanıcı sana her çalışma için Başlık, Yıl ve Özet verecek. Görevin bu çalışmaları önceden belirlenmiş dahil etme (IC) ve hariç tutma (EC) ölçütlerine göre incelemek ve sonucu JSON array formatında sunmaktır.

KRİTİK: Title, Abstract, Authors, Year alanlarını YANITINDA ASLA tekrarlama. Sadece türetilmiş alanları döndür (token tasarrufu için).

Her çalışma için döndüreceğin alanlar:
1. id: Sana verilen makale id'si (aynen geri ver)
2. summary_tr: Çalışmanın kısa, anlaşılır Türkçe özeti
3. decision: "Include", "Exclude" veya "Uncertain" (Maybe yerine Uncertain kullan)
4. confidence: 0.0 - 1.0 arası karar güveni
5. matched_inclusion_criteria: Eşleşen IC kodları array (örn: ["IC1", "IC2"])
6. matched_exclusion_criteria: Eşleşen EC kodları array (örn: ["EC3"])
7. needs_human_review: confidence < 0.7 veya kararsız ise true
8. rationale: Kararın kısa, açık gerekçesi (kriter kodlarına atıf yap)
"""

OUTPUT_FORMAT = """## ÇIKTI FORMATI

Sadece şu JSON'u döndür (başka açıklama yok):

```json
{
  "results": [
    {
      "id": "<verilen id>",
      "summary_tr": "<Türkçe özet>",
      "decision": "Include | Exclude | Uncertain",
      "confidence": 0.85,
      "matched_inclusion_criteria": ["IC1"],
      "matched_exclusion_criteria": [],
      "needs_human_review": false,
      "rationale": "<gerekçe, IC/EC kodlarına atıf yap>"
    }
  ]
}
```

KURALLAR:
- "Maybe" YOK, "Uncertain" kullan
- confidence < 0.7 ise needs_human_review=true
- Title, Abstract, Authors, Year alanlarını ASLA tekrarlama
- decision="Exclude" ise matched_exclusion_criteria boş olamaz
- decision="Include" ise matched_inclusion_criteria boş olamaz
"""


def load_criteria(path: Optional[Path]) -> List[Dict[str, str]]:
    if not path:
        return []
    text = path.read_text(encoding="utf-8")
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    return [{"code": "", "text": ln} for ln in lines]


def code_criteria(items: List[Dict[str, str]], prefix: str) -> List[Dict[str, str]]:
    return [{"code": f"{prefix}{i+1}", "text": c["text"]} for i, c in enumerate(items)]


def build_instructions(inclusion: List[Dict], exclusion: List[Dict]) -> str:
    parts = [SYSTEM_PROMPT, "\n---\n\n## ✅ Dahil Etme Ölçütleri (IC):"]
    for c in inclusion:
        parts.append(f"- **{c['code']}**: {c['text']}")
    parts.append("\n## ❌ Hariç Tutma Ölçütleri (EC):")
    for c in exclusion:
        parts.append(f"- **{c['code']}**: {c['text']}")
    parts.append("\n---\n\n" + OUTPUT_FORMAT)
    return "\n".join(parts)


def build_batch_prompt(articles: List[Article], instructions: str) -> str:
    parts = [instructions, "\n---\n\n## DEĞERLENDİRİLECEK MAKALELER:\n"]
    for a in articles:
        parts.append(f"### id: {a.ID}")
        parts.append(f"Başlık: {a.Title}")
        if a.Year:
            parts.append(f"Yıl: {a.Year}")
        parts.append(f"Özet: {a.Abstract}\n")
    parts.append(f"\nLütfen yukarıdaki {len(articles)} makale için JSON array döndür.")
    return "\n".join(parts)


def parse_model_response(text: str) -> List[Dict[str, Any]]:
    text = re.sub(r"```json\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        text = m.group(0)
    try:
        data = json.loads(text)
        if isinstance(data, dict) and isinstance(data.get("results"), list):
            return data["results"]
        if isinstance(data, list):
            return data
        return [data]
    except json.JSONDecodeError as e:
        print(f"  ⚠️  JSON parse hatası: {e}", file=sys.stderr)
        return []


def merge_result(article: Article, api_result: Dict[str, Any]) -> Result:
    conf = api_result.get("confidence")
    return Result(
        id=article.ID,
        authors=article.Authors,
        title=article.Title,
        year=article.Year,
        abstract=article.Abstract,
        summary_tr=api_result.get("summary_tr", ""),
        decision=api_result.get("decision", "Uncertain"),
        confidence=float(conf) if isinstance(conf, (int, float)) else None,
        matched_inclusion_criteria=api_result.get("matched_inclusion_criteria") or [],
        matched_exclusion_criteria=api_result.get("matched_exclusion_criteria") or [],
        needs_human_review=bool(api_result.get("needs_human_review", False)),
        rationale=api_result.get("rationale", ""),
    )


# ============================================================
# COST ACCUMULATION
# ============================================================
def add_usage(state: State, input_tokens: int, output_tokens: int) -> None:
    m = MODELS[state.model_id]
    tier = "batch" if state.mode == "async" else "standard"
    p = m[tier]
    state.total_input_tokens += input_tokens
    state.total_output_tokens += output_tokens
    state.total_cost_usd += (input_tokens / 1e6) * p["input"] + (output_tokens / 1e6) * p["output"]


# ============================================================
# SYNC MODE — REAL BATCH (N articles per API call)
# ============================================================
def call_gemini_sync(model_id: str, api_key: str, prompt: str, retry: int = 0) -> Dict[str, Any]:
    url = f"{API_BASE}/models/{model_id}:generateContent?key={api_key}"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 8192,
            "responseMimeType": "application/json",
        },
    }
    try:
        resp = requests.post(url, json=body, timeout=180)
        if not resp.ok:
            err = (resp.json().get("error", {}).get("message", resp.text)
                   if resp.headers.get("Content-Type", "").startswith("application/json")
                   else resp.text)
            if resp.status_code in (429, 503) and retry < 5:
                wait = 2 ** retry * 2
                print(f"  ⏳ Rate limit ({resp.status_code}), {wait}s sonra tekrar... ({retry+1}/5)")
                time.sleep(wait)
                return call_gemini_sync(model_id, api_key, prompt, retry + 1)
            raise RuntimeError(f"API {resp.status_code}: {err}")
        return resp.json()
    except requests.RequestException as e:
        if retry < 5:
            wait = 2 ** retry * 2
            print(f"  ⏳ Ağ hatası: {e}, {wait}s sonra tekrar... ({retry+1}/5)")
            time.sleep(wait)
            return call_gemini_sync(model_id, api_key, prompt, retry + 1)
        raise


def run_sync(articles: List[Article], state: State, api_key: str, instructions: str,
             batch_size: int, delay_sec: float, save_state_fn) -> List[Result]:
    results: List[Result] = [Result(**r) for r in state.results]
    batches = [articles[i:i + batch_size] for i in range(0, len(articles), batch_size)]
    start_idx = state.last_processed_batch_index + 1

    for bi in range(start_idx, len(batches)):
        batch = batches[bi]
        print(f"[Batch {bi+1}/{len(batches)}] {len(batch)} makale işleniyor "
              f"(toplam: {len(results)}/{len(articles)})...")

        prompt = build_batch_prompt(batch, instructions)
        try:
            data = call_gemini_sync(state.model_id, api_key, prompt)
        except Exception as e:
            print(f"  ❌ Batch {bi+1} hatası: {e}", file=sys.stderr)
            print(f"  💾 Mevcut sonuçlar kaydedildi, devam etmek için --resume kullan")
            save_state_fn(state)
            break

        usage = data.get("usageMetadata", {})
        add_usage(state, usage.get("promptTokenCount", 0), usage.get("candidatesTokenCount", 0))

        text = (data.get("candidates", [{}])[0].get("content", {})
                    .get("parts", [{}])[0].get("text", ""))
        api_results = parse_model_response(text)

        api_by_id = {str(r.get("id")): r for r in api_results}
        for article in batch:
            api_r = api_by_id.get(str(article.ID), {
                "summary_tr": "API yanıtında bulunamadı",
                "decision": "Uncertain",
                "confidence": 0,
                "matched_inclusion_criteria": [],
                "matched_exclusion_criteria": [],
                "needs_human_review": True,
                "rationale": "Modelden yanıt alınamadı",
            })
            r = merge_result(article, api_r)
            results.append(r)
            state.results.append(asdict(r))

        state.last_processed_batch_index = bi
        save_state_fn(state)

        print(f"  ✓ {len(batch)} sonuç eklendi | "
              f"Token: in={state.total_input_tokens:,} out={state.total_output_tokens:,} | "
              f"Maliyet: ${state.total_cost_usd:.4f}")

        if bi < len(batches) - 1 and delay_sec > 0:
            time.sleep(delay_sec)

    return results


# ============================================================
# ASYNC MODE — BATCH API (50% discount, async, up to 24h)
# ============================================================
def submit_batch_job(model_id: str, api_key: str, articles: List[Article],
                     instructions: str, state: State) -> str:
    requests_payload = []
    for article in articles:
        key = str(article.ID)
        state.batch_key_map[key] = asdict(article)
        requests_payload.append({
            "key": key,
            "request": {
                "contents": [{"parts": [{"text": build_batch_prompt([article], instructions)}]}],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 2048,
                    "responseMimeType": "application/json",
                },
            },
        })

    url = f"{API_BASE}/models/{model_id}:batchGenerateContent?key={api_key}"
    body = {
        "batch": {
            "display_name": f"screening-cli-{int(time.time())}",
            "input_config": {"requests": {"requests": requests_payload}},
        }
    }
    print(f"  → Submit: {len(requests_payload)} istek (inline)")
    resp = requests.post(url, json=body, timeout=600)
    if not resp.ok:
        err = resp.json().get("error", {}).get("message", resp.text)
        raise RuntimeError(f"Batch submit {resp.status_code}: {err}")
    return resp.json()["name"]


def fetch_batch_status(api_key: str, job_name: str) -> Dict[str, Any]:
    url = f"{API_BASE}/{job_name}?key={api_key}"
    resp = requests.get(url, timeout=60)
    if not resp.ok:
        err = resp.json().get("error", {}).get("message", resp.text)
        raise RuntimeError(f"Status {resp.status_code}: {err}")
    return resp.json()


def poll_batch_job(api_key: str, state: State, save_state_fn,
                   poll_interval: int = 60) -> Dict[str, Any]:
    print(f"\n⏳ Batch job polling başlıyor: {state.batch_job_name}")
    print(f"   Polling aralığı: {poll_interval}s. Ctrl+C ile durdurabilirsin (state kaydedilir).")

    start = state.batch_submitted_at or time.time()
    while True:
        try:
            job = fetch_batch_status(api_key, state.batch_job_name)
        except Exception as e:
            print(f"  ⚠️  Status fetch hatası: {e}, 30s sonra tekrar...")
            time.sleep(30)
            continue

        st = (job.get("metadata") or {}).get("state", "UNKNOWN")
        state.batch_last_state = st
        save_state_fn(state)

        elapsed = int((time.time() - start) / 60)
        print(f"  [{elapsed:>3} dk] {st}")

        if st in ("JOB_STATE_SUCCEEDED", "SUCCEEDED"):
            return job
        if st in ("JOB_STATE_FAILED", "FAILED", "JOB_STATE_CANCELLED", "CANCELLED"):
            raise RuntimeError(f"Batch job durdu: {st}. {job.get('error', {}).get('message', '')}")

        time.sleep(poll_interval)


def process_batch_results(job: Dict[str, Any], state: State, api_key: str) -> List[Result]:
    results: List[Result] = []
    inlined = (job.get("response") or {}).get("inlinedResponses", {}).get("inlinedResponses", [])

    if not inlined:
        responses_file = (job.get("response") or {}).get("responsesFile")
        if responses_file:
            return _process_results_file(responses_file, state, api_key)

    for item in inlined:
        key = item.get("key", "")
        article_dict = state.batch_key_map.get(key)
        if not article_dict:
            continue
        article = Article(**article_dict)

        response = item.get("response") or {}
        text = (response.get("candidates", [{}])[0].get("content", {})
                        .get("parts", [{}])[0].get("text", ""))

        if text:
            parsed = parse_model_response(text)
            api_r = parsed[0] if parsed else _failed_api_result("Parse hatası")
            usage = response.get("usageMetadata", {})
            add_usage(state, usage.get("promptTokenCount", 0), usage.get("candidatesTokenCount", 0))
        else:
            err_msg = (item.get("error") or {}).get("message", "Boş yanıt")
            api_r = _failed_api_result(err_msg)

        r = merge_result(article, api_r)
        results.append(r)
        state.results.append(asdict(r))

    return results


def _process_results_file(file_name: str, state: State, api_key: str) -> List[Result]:
    print(f"  → Output file indiriliyor: {file_name}")
    url = f"{API_BASE}/{file_name}:download?alt=media&key={api_key}"
    resp = requests.get(url, timeout=600)
    if not resp.ok:
        raise RuntimeError(f"File fetch {resp.status_code}")
    results: List[Result] = []
    for line in resp.text.split("\n"):
        line = line.strip()
        if not line:
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            continue
        key = item.get("key", "")
        article_dict = state.batch_key_map.get(key)
        if not article_dict:
            continue
        article = Article(**article_dict)
        response = item.get("response") or {}
        text = (response.get("candidates", [{}])[0].get("content", {})
                        .get("parts", [{}])[0].get("text", ""))
        if text:
            parsed = parse_model_response(text)
            api_r = parsed[0] if parsed else _failed_api_result("Parse hatası")
            usage = response.get("usageMetadata", {})
            add_usage(state, usage.get("promptTokenCount", 0), usage.get("candidatesTokenCount", 0))
        else:
            err_msg = (item.get("error") or {}).get("message", "Boş yanıt")
            api_r = _failed_api_result(err_msg)
        r = merge_result(article, api_r)
        results.append(r)
        state.results.append(asdict(r))
    return results


def _failed_api_result(reason: str) -> Dict[str, Any]:
    return {
        "summary_tr": "Hata",
        "decision": "Uncertain",
        "confidence": 0,
        "matched_inclusion_criteria": [],
        "matched_exclusion_criteria": [],
        "needs_human_review": True,
        "rationale": reason,
    }


# ============================================================
# COST ESTIMATION (PRE-RUN)
# ============================================================
def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def print_cost_estimate(articles: List[Article], state: State, instructions: str,
                        batch_size: int) -> None:
    instr_tokens = estimate_tokens(instructions)
    avg_article_tokens = sum(estimate_tokens(a.Title + a.Abstract + a.Year)
                             for a in articles) // max(1, len(articles))
    n = len(articles)
    num_batches = (n + batch_size - 1) // batch_size

    sync_input = num_batches * instr_tokens + n * avg_article_tokens
    async_input = n * (instr_tokens + avg_article_tokens)
    output_total = n * 200

    m = MODELS[state.model_id]
    sync_cost = (sync_input / 1e6) * m["standard"]["input"] + (output_total / 1e6) * m["standard"]["output"]
    batch_cost = (async_input / 1e6) * m["batch"]["input"] + (output_total / 1e6) * m["batch"]["output"]

    print("\n" + "═" * 60)
    print("💰 MALİYET TAHMİNİ")
    print("═" * 60)
    print(f"Toplam makale:          {n:,}")
    print(f"Tahmini input token:    ~{sync_input:,} (sync) / ~{async_input:,} (async)")
    print(f"Tahmini output token:   ~{output_total:,}")
    print(f"")
    sel_marker = "← seçili" if state.mode == "sync" else ""
    print(f"Sync (Standard tier):   ${sync_cost:.4f}  {sel_marker}")
    sel_marker = "← seçili" if state.mode == "async" else ""
    print(f"Async Batch API (-%50): ${batch_cost:.4f}  {sel_marker}")
    if m["free_tier"]:
        print(f"\n✓ Free Tier kotanızdaysa: $0 (RPD limitine kadar ücretsiz)")
    else:
        print(f"\n⚠️  {m['label']} sadece Paid Tier — gösterilen maliyet uygulanacak")
    print("═" * 60 + "\n")


# ============================================================
# STATE PERSISTENCE
# ============================================================
def save_state(state: State, path: Path) -> None:
    path.write_text(json.dumps(asdict(state), ensure_ascii=False, indent=2),
                    encoding="utf-8")


def load_state(path: Path) -> Optional[State]:
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return State(**data)
    except Exception as e:
        print(f"⚠️  State yükleme hatası: {e}", file=sys.stderr)
        return None


def file_hash_from_articles(articles: List[Article]) -> str:
    h = hashlib.sha256()
    for a in articles:
        h.update((a.ID + a.Title).encode("utf-8"))
    return h.hexdigest()[:16]


# ============================================================
# MAIN
# ============================================================
def main() -> int:
    parser = argparse.ArgumentParser(
        description="Gemini Literature Screening CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Örnek kullanım:
  # Sync mod
  python cli.py -i articles.xlsx -o results.xlsx \\
      --inclusion criteria/ic.txt --exclusion criteria/ec.txt \\
      --model gemini-3.1-flash-lite-preview --mode sync

  # Async batch (önerilen, %50 ucuz)
  python cli.py -i articles.xlsx -o results.xlsx \\
      --inclusion criteria/ic.txt --exclusion criteria/ec.txt \\
      --mode async

  # Yarım kalan analizi devam ettir
  python cli.py --resume

  # Sadece maliyet tahmini (analiz başlatmadan)
  python cli.py -i articles.xlsx --inclusion ic.txt --exclusion ec.txt --estimate-only
""",
    )
    parser.add_argument("-i", "--input", type=Path, help="CSV/TSV/XLSX girdi dosyası")
    parser.add_argument("-o", "--output", type=Path, help="Çıktı dosyası (CSV veya XLSX)")
    parser.add_argument("--inclusion", type=Path, help="IC kriterleri (her satır = bir kriter)")
    parser.add_argument("--exclusion", type=Path, help="EC kriterleri (her satır = bir kriter)")
    parser.add_argument("--model", default="gemini-3.1-flash-lite-preview",
                        choices=list(MODELS.keys()))
    parser.add_argument("--mode", default="sync", choices=["sync", "async"])
    parser.add_argument("--batch-size", type=int, default=5,
                        help="Sync modda tek istekte makale sayısı")
    parser.add_argument("--delay", type=float, default=2.0,
                        help="Sync modda batch arası bekleme (saniye)")
    parser.add_argument("--api-key", default=os.environ.get("GEMINI_API_KEY", ""),
                        help="Gemini API key (veya GEMINI_API_KEY env)")
    parser.add_argument("--state-file", type=Path, default=Path(".screening_state.json"))
    parser.add_argument("--resume", action="store_true",
                        help="State dosyasından devam et")
    parser.add_argument("--estimate-only", action="store_true",
                        help="Sadece maliyet tahmini, analiz başlatma")
    parser.add_argument("--poll-interval", type=int, default=60,
                        help="Async polling aralığı (saniye)")
    args = parser.parse_args()

    # ----- Resume path
    if args.resume:
        state = load_state(args.state_file)
        if not state:
            sys.exit(f"❌ State dosyası bulunamadı: {args.state_file}")
        api_key = args.api_key or os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            sys.exit("❌ API key gerekli (--api-key veya GEMINI_API_KEY)")
        if not args.input or not args.output or not args.inclusion or not args.exclusion:
            sys.exit("❌ Resume için --input, --output, --inclusion, --exclusion gerekli")

        articles = read_articles(args.input)
        inclusion = code_criteria(load_criteria(args.inclusion), "IC")
        exclusion = code_criteria(load_criteria(args.exclusion), "EC")
        instructions = build_instructions(inclusion, exclusion)

        print(f"▶️  Devam ediliyor: {state.mode} | Model: {state.model_id}")
        print(f"   İşlenen: {len(state.results)}/{state.total_count}")

        save_fn = lambda s: save_state(s, args.state_file)
        if state.mode == "async":
            try:
                job = poll_batch_job(api_key, state, save_fn, args.poll_interval)
                results = process_batch_results(job, state, api_key)
            except KeyboardInterrupt:
                print("\n⏸️  Polling durduruldu, state kaydedildi.")
                save_fn(state)
                return 0
        else:
            results = run_sync(articles, state, api_key, instructions,
                               args.batch_size, args.delay, save_fn)
        write_results(results, state, instructions, inclusion, exclusion, args.output)
        print(f"✅ Sonuçlar yazıldı: {args.output}")
        if len(state.results) >= state.total_count:
            args.state_file.unlink(missing_ok=True)
        return 0

    # ----- Fresh run
    if not args.input:
        parser.error("--input gerekli (veya --resume)")
    if not args.inclusion or not args.exclusion:
        parser.error("--inclusion ve --exclusion gerekli")

    articles = read_articles(args.input)
    if not articles:
        sys.exit("❌ Dosyada makale bulunamadı.")

    inclusion = code_criteria(load_criteria(args.inclusion), "IC")
    exclusion = code_criteria(load_criteria(args.exclusion), "EC")
    instructions = build_instructions(inclusion, exclusion)
    prompt_hash = hashlib.sha256(instructions.encode("utf-8")).hexdigest()[:8]

    fhash = file_hash_from_articles(articles)
    state = State(
        model_id=args.model,
        mode=args.mode,
        file_hash=fhash,
        total_count=len(articles),
        prompt_hash=prompt_hash,
    )

    print(f"\n📚 {len(articles):,} makale yüklendi")
    print(f"📋 IC: {len(inclusion)} kriter | EC: {len(exclusion)} kriter")
    print(f"🤖 Model: {MODELS[args.model]['label']} ({args.model})")
    print(f"⚙️  Mod: {args.mode} | Prompt versiyon: {prompt_hash}")

    print_cost_estimate(articles, state, instructions, args.batch_size)

    if args.estimate_only:
        return 0

    if not args.output:
        parser.error("--output gerekli (analiz için)")
    api_key = args.api_key
    if not api_key:
        sys.exit("❌ API key gerekli (--api-key veya GEMINI_API_KEY)")

    save_fn = lambda s: save_state(s, args.state_file)
    save_fn(state)

    if args.mode == "async":
        print("🚀 Async Batch job gönderiliyor...")
        try:
            job_name = submit_batch_job(args.model, api_key, articles, instructions, state)
            state.batch_job_name = job_name
            state.batch_submitted_at = time.time()
            save_fn(state)
            print(f"✓ Job gönderildi: {job_name}\n")

            try:
                job = poll_batch_job(api_key, state, save_fn, args.poll_interval)
                results = process_batch_results(job, state, api_key)
            except KeyboardInterrupt:
                print("\n⏸️  Polling durduruldu. Devam etmek için: python cli.py --resume ...")
                save_fn(state)
                return 0
        except Exception as e:
            print(f"❌ Async batch hatası: {e}", file=sys.stderr)
            save_fn(state)
            return 1
    else:
        print("🚀 Sync analiz başlıyor...\n")
        try:
            results = run_sync(articles, state, api_key, instructions,
                               args.batch_size, args.delay, save_fn)
        except KeyboardInterrupt:
            print("\n⏸️  Durduruldu. Devam etmek için: python cli.py --resume ...")
            save_fn(state)
            return 0

    write_results(results, state, instructions, inclusion, exclusion, args.output)
    print(f"\n✅ Tamamlandı! {len(results):,} sonuç yazıldı: {args.output}")
    print(f"📊 Toplam token: {state.total_input_tokens:,} input + {state.total_output_tokens:,} output")
    print(f"💰 Toplam maliyet: ${state.total_cost_usd:.4f}")

    if len(state.results) >= state.total_count:
        args.state_file.unlink(missing_ok=True)

    return 0


if __name__ == "__main__":
    sys.exit(main())
