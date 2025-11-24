import os
import sys
import argparse
from typing import List, Tuple, Optional
import pdfplumber
import docx
import pandas as pd
from diff_match_patch import diff_match_patch
import html

class DocumentLoader:
    @staticmethod
    def load(file_path: str) -> str:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == '.pdf':
            return DocumentLoader._load_pdf(file_path)
        elif ext == '.docx':
            return DocumentLoader._load_docx(file_path)
        elif ext in ['.xlsx', '.xls']:
            return DocumentLoader._load_excel(file_path)
        elif ext == '.txt':
            return DocumentLoader._load_txt(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    @staticmethod
    def _load_pdf(path: str) -> str:
        text = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text.append(extracted)
        return "\n".join(text)

    @staticmethod
    def _load_docx(path: str) -> str:
        doc = docx.Document(path)
        return "\n".join([para.text for para in doc.paragraphs])

    @staticmethod
    def _load_excel(path: str) -> str:
        df = pd.read_excel(path)
        return df.to_string(index=False)

    @staticmethod
    def _load_txt(path: str) -> str:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()

class Comparator:
    def __init__(self):
        self.dmp = diff_match_patch()

    def compare(self, text1: str, text2: str) -> List[Tuple[int, str]]:
        # Compute diff
        diffs = self.dmp.diff_main(text1, text2)
        self.dmp.diff_cleanupSemantic(diffs)
        return diffs

class ReportGenerator:
    @staticmethod
    def generate_html(diffs: List[Tuple[int, str]], output_path: str, file1_name: str, file2_name: str):
        html_content = []
        
        # Header
        html_content.append(f"""
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Karşılaştırma Raporu</title>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f9f9f9; }}
                .container {{ background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                h1 {{ color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }}
                .meta {{ background: #f1f8ff; padding: 15px; border-radius: 4px; margin-bottom: 30px; border-left: 4px solid #3498db; }}
                .content {{ white-space: pre-wrap; font-size: 16px; line-height: 1.8; }}
                ins {{ background-color: #e6ffec; color: #24292e; text-decoration: none; border-bottom: 2px solid #2ea44f; }}
                del {{ background-color: #ffebe9; color: #cb2431; text-decoration: line-through; }}
                .legend {{ margin-bottom: 20px; font-size: 0.9em; color: #666; }}
                .legend span {{ display: inline-block; margin-right: 15px; padding: 2px 8px; border-radius: 3px; }}
                .legend-added {{ background-color: #e6ffec; border-bottom: 2px solid #2ea44f; }}
                .legend-deleted {{ background-color: #ffebe9; text-decoration: line-through; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Dosya Karşılaştırma Raporu</h1>
                
                <div class="meta">
                    <p><strong>Dosya 1 (Eski):</strong> {file1_name}</p>
                    <p><strong>Dosya 2 (Yeni):</strong> {file2_name}</p>
                </div>

                <div class="legend">
                    <span class="legend-added">Eklenen Metin</span>
                    <span class="legend-deleted">Silinen Metin</span>
                </div>

                <div class="content">
        """)

        # Diff Content
        for op, text in diffs:
            text = html.escape(text)
            if op == 1:  # Insert
                html_content.append(f"<ins>{text}</ins>")
            elif op == -1:  # Delete
                html_content.append(f"<del>{text}</del>")
            else:  # Equal
                html_content.append(text)

        # Footer
        html_content.append("""
                </div>
            </div>
        </body>
        </html>
        """)

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("".join(html_content))
        
        print(f"Rapor oluşturuldu: {output_path}")

def main():
    parser = argparse.ArgumentParser(description='İki dosyayı karşılaştır ve HTML raporu oluştur.')
    parser.add_argument('file1', help='Eski dosya yolu')
    parser.add_argument('file2', help='Yeni dosya yolu')
    parser.add_argument('--output', '-o', default='karsilastirma_raporu.html', help='Çıktı HTML dosya yolu')

    args = parser.parse_args()

    try:
        print(f"Yükleniyor: {args.file1}...")
        text1 = DocumentLoader.load(args.file1)
        
        print(f"Yükleniyor: {args.file2}...")
        text2 = DocumentLoader.load(args.file2)

        print("Karşılaştırılıyor...")
        comparator = Comparator()
        diffs = comparator.compare(text1, text2)

        print("Rapor oluşturuluyor...")
        ReportGenerator.generate_html(diffs, args.output, os.path.basename(args.file1), os.path.basename(args.file2))

    except Exception as e:
        print(f"Hata: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
