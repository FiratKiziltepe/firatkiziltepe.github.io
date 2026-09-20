"""
PDF -> JSON converter for MEB criteria PDFs

Outputs a list of items like:
[
  {
    "main_code": "1",
    "main_title": "ANAYASA VE DİĞER MEVZUATA UYGUNLUĞU",
    "code": "1.1.1",
    "section": "1.1 Genel",
    "title": "....",
    "details": ["...", "..."]
  },
  ...
]

Install:
  pip install pymupdf

Run:
  python pdf_to_criteria_json.py

Adjust PDF_PATH / OUTPUT_JSON if needed.
"""

import json
import re
import fitz  # PyMuPDF

PDF_PATH = "kriter.pdf"
OUTPUT_JSON = "criteria.json"

# 8 ana kriter (sabit)
MAIN_CRITERIA = {
    "1": "ANAYASA VE DİĞER MEVZUATA UYGUNLUĞU",
    "2": "BİLİMSEL YETERLİLİĞİ",
    "3": "EĞİTİM VE ÖĞRETİM PROGRAMININ AMAÇ VE KAPSAMINA UYGUNLUĞU",
    "4": "EĞİTİM VE ÖĞRETİM PROGRAMININ BÜTÜNLEŞİK YAPISINA UYGUNLUĞU",
    "5": "ÖLÇME VE DEĞERLENDİRME SÜRECİNİN UYGUNLUĞU",
    "6": "DİL VE ANLATIM YÖNÜNDEN YETERLİLİĞİ",
    "7": "GÖRSEL TASARIMIN VE İÇERİK TASARIMININ UYGUNLUĞU",
    "8": "ELEKTRONİK İÇERİKLERİN KAPSAM VE TASARIMININ UYGUNLUĞU",
}

# Örn: "1.1. Genel"
SECTION_PATTERN = re.compile(r"^\s*(\d+\.\d+)\.\s+(.+?)\s*$")

# Örn: "1.1.1. İçerikte ..."
ITEM_PATTERN = re.compile(r"^\s*(\d+\.\d+\.\d+)\.\s+(.+?)\s*$")

# Satır başı bullet: • ·  ● ○ - – * o
BULLET_LINE_PATTERN = re.compile(r"^\s*(?:[•·●○\-–\*o])\s+(.*\S)\s*$")

# Title içinde geçen inline bulletları bölmek için
INLINE_BULLET_SPLIT = re.compile(r"\s*[•·●]\s*")

SOFT_HYPHEN = "\u00AD"  # PDF'lerde kelime bölme işareti


def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    return "\n".join(page.get_text("text") for page in doc)


def clean_text(s: str) -> str:
    s = s.replace(SOFT_HYPHEN, "")
    # Bazı PDF'lerde garip tire/kırpma boşlukları olabilir; normalleştir
    s = re.sub(r"\s+", " ", s).strip()
    return s


def smart_join(a: str, b: str) -> str:
    """
    Satır kırılmalarını birleştir.
    - a '-' ile bitiyorsa, '-' kaldırıp doğrudan bitiştir.
    - Aksi halde araya boşluk koy.
    """
    a = a.rstrip()
    b = b.lstrip()
    if not a:
        return b
    if a.endswith("-"):
        return (a[:-1] + b).strip()
    return (a + " " + b).strip()


def split_inline_bullets(title: str):
    """
    Title içinde geçen bulletları ayırır:
    "Başlık. • detay1 • detay2" -> ("Başlık.", ["detay1", "detay2"])
    """
    parts = INLINE_BULLET_SPLIT.split(title)
    parts = [clean_text(p) for p in parts if clean_text(p)]
    if len(parts) <= 1:
        return clean_text(title), []
    return parts[0], parts[1:]


def parse_criteria(raw_text: str):
    raw_lines = raw_text.splitlines()

    criteria = []
    current_section = None
    current_item = None

    # Yeni madde açıldıktan sonra ilk bullet gelene kadar gelen satırları title'a ekle
    in_title_continuation = False

    def flush_current():
        nonlocal current_item
        if not current_item:
            return

        # Temizlik
        current_item["title"] = clean_text(current_item["title"])
        current_item["details"] = [clean_text(d) for d in current_item["details"] if clean_text(d)]

        # Kritik: title içine sızmış inline bulletları details'e aktar
        new_title, inline_details = split_inline_bullets(current_item["title"])
        current_item["title"] = new_title
        if inline_details:
            current_item["details"].extend(inline_details)

        # Son bir temizlik
        current_item["details"] = [clean_text(d) for d in current_item["details"] if clean_text(d)]

        criteria.append(current_item)
        current_item = None

    for raw_line in raw_lines:
        if not raw_line.strip():
            # boş satır: detail wrap kesilebilir; burada özel bir şey yapmıyoruz
            continue

        line = raw_line.rstrip()

        # SECTION: 1.1. Genel
        sec_m = SECTION_PATTERN.match(line)
        if sec_m:
            current_section = f"{sec_m.group(1)} {sec_m.group(2)}"
            continue

        # ITEM: 1.1.1. ...
        item_m = ITEM_PATTERN.match(line)
        if item_m:
            flush_current()

            code = item_m.group(1)
            main_code = code.split(".")[0]

            current_item = {
                "main_code": main_code,
                "main_title": MAIN_CRITERIA.get(main_code),
                "code": code,
                "section": current_section,
                "title": clean_text(item_m.group(2)),
                "details": [],
            }
            in_title_continuation = True
            continue

        if not current_item:
            continue

        # Satır başı bullet: • ...
        b_m = BULLET_LINE_PATTERN.match(line)
        if b_m:
            current_item["details"].append(clean_text(b_m.group(1)))
            in_title_continuation = False
            continue

        # Normal satır
        text = clean_text(line)

        if in_title_continuation:
            # Bullet başlamadıysa title devamı
            current_item["title"] = smart_join(current_item["title"], text)
        else:
            # Bullet başladıktan sonra gelen satırlar genelde wrap; son detail'e ekle
            if current_item["details"]:
                current_item["details"][-1] = smart_join(current_item["details"][-1], text)
            else:
                # Nadiren bullet gelmeden in_title_continuation false olabilir; güvenli fallback
                current_item["title"] = smart_join(current_item["title"], text)

    flush_current()
    return criteria


def main():
    raw_text = extract_text_from_pdf(PDF_PATH)
    criteria = parse_criteria(raw_text)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(criteria, f, ensure_ascii=False, indent=2)

    print(f"✅ {len(criteria)} madde yazıldı -> {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
