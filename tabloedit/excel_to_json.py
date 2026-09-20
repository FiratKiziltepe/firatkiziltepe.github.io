#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Excel to JSON Converter
Excel dosyasını data.json formatına çevirir
"""

import pandas as pd
import json
import sys
import os
from pathlib import Path

def excel_to_json(excel_file, output_file='data.json'):
    """
    Excel dosyasını JSON formatına çevirir
    
    Args:
        excel_file (str): Excel dosya yolu
        output_file (str): Çıktı JSON dosya adı
    """
    try:
        print(f"📊 Excel dosyası okunuyor: {excel_file}")
        
        # Excel dosyasını oku
        if excel_file.endswith('.xlsx'):
            df = pd.read_excel(excel_file, engine='openpyxl')
        elif excel_file.endswith('.xls'):
            df = pd.read_excel(excel_file, engine='xlrd')
        else:
            raise ValueError("Desteklenen formatlar: .xlsx, .xls")
        
        print(f"✅ {len(df)} satır, {len(df.columns)} sütun okundu")
        print(f"📋 Sütunlar: {list(df.columns)}")
        
        # NaN değerleri boş string'e çevir
        df = df.fillna('')
        
        # DataFrame'i JSON'a çevir
        json_data = df.to_dict('records')
        
        # JSON dosyasına yaz
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)
        
        print(f"🎉 JSON dosyası oluşturuldu: {output_file}")
        print(f"📈 Dosya boyutu: {os.path.getsize(output_file):,} bytes")
        
        # İlk birkaç satırı önizle
        print(f"\n📝 İlk 3 satır önizleme:")
        for i, row in enumerate(json_data[:3]):
            print(f"  {i+1}. {dict(list(row.items())[:2])}...")
        
        return True
        
    except FileNotFoundError:
        print(f"❌ Dosya bulunamadı: {excel_file}")
        return False
    except Exception as e:
        print(f"❌ Hata oluştu: {str(e)}")
        return False

def validate_json_structure(json_file):
    """
    JSON dosyasının tablo sistemi için uygun olup olmadığını kontrol eder
    """
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            print("⚠️  JSON dosyası array formatında olmalı")
            return False
        
        if len(data) == 0:
            print("⚠️  JSON dosyası boş")
            return False
        
        # İlk satırın anahtarlarını kontrol et
        first_row = data[0]
        required_columns = ['DERS ADI', 'SIRA NO']
        
        print(f"\n🔍 JSON yapısı kontrol ediliyor...")
        print(f"   Toplam satır: {len(data)}")
        print(f"   Sütun sayısı: {len(first_row.keys())}")
        print(f"   Sütunlar: {list(first_row.keys())}")
        
        # Önerilen sütunları kontrol et
        found_columns = []
        for col in required_columns:
            if any(col.upper() in key.upper() for key in first_row.keys()):
                found_columns.append(col)
        
        if found_columns:
            print(f"✅ Gerekli sütunlar bulundu: {found_columns}")
        else:
            print(f"⚠️  Önerilen sütunlar bulunamadı: {required_columns}")
        
        return True
        
    except Exception as e:
        print(f"❌ JSON doğrulama hatası: {str(e)}")
        return False

def main():
    """Ana fonksiyon"""
    print("🔄 Excel to JSON Converter")
    print("=" * 40)
    
    # Komut satırı argümanlarını kontrol et
    if len(sys.argv) < 2:
        print("📁 Mevcut dizindeki Excel dosyaları:")
        excel_files = list(Path('.').glob('*.xlsx')) + list(Path('.').glob('*.xls'))
        
        if not excel_files:
            print("   Excel dosyası bulunamadı (.xlsx veya .xls)")
            print("\n💡 Kullanım: python excel_to_json.py dosya.xlsx")
            return
        
        for i, file in enumerate(excel_files, 1):
            print(f"   {i}. {file.name}")
        
        # Kullanıcıdan seçim al
        try:
            choice = int(input(f"\nDönüştürülecek dosyayı seçin (1-{len(excel_files)}): ")) - 1
            excel_file = str(excel_files[choice])
        except (ValueError, IndexError):
            print("❌ Geçersiz seçim")
            return
    else:
        excel_file = sys.argv[1]
    
    # Dosyanın varlığını kontrol et
    if not os.path.exists(excel_file):
        print(f"❌ Dosya bulunamadı: {excel_file}")
        return
    
    # Çıktı dosya adını belirle
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'data.json'
    
    print(f"\n🚀 Dönüştürme başlıyor...")
    print(f"   Kaynak: {excel_file}")
    print(f"   Hedef:  {output_file}")
    
    # Dönüştürme işlemini yap
    success = excel_to_json(excel_file, output_file)
    
    if success:
        # JSON yapısını doğrula
        validate_json_structure(output_file)
        print(f"\n🎯 Tamamlandı! {output_file} dosyası hazır.")
        print("📝 Bu dosyayı web projenizin ana dizinine kopyalayın.")
    else:
        print("\n💥 Dönüştürme başarısız!")

if __name__ == "__main__":
    main()

