from PyPDF2 import PdfReader

reader = PdfReader('/home/ubuntu/upload/15183917_tymm_kriter_ve_aciklamalari.pdf')
text = ''
for page in reader.pages:
    text += page.extract_text()

with open('extracted_text.txt', 'w') as f:
    f.write(text)

