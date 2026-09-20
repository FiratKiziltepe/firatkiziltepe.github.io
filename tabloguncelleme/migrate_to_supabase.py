"""
JSON verisini Supabase'e migrate etmek için script.

Kullanım:
1. pip install supabase
2. SUPABASE_URL ve SUPABASE_KEY değerlerini doldurun
3. python migrate_to_supabase.py
"""

import json
import os
from supabase import create_client, Client

# Supabase bilgileri - BUNLARI KENDİ SUPABASE PROJENİZDEN ALIN
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://prtogxfwngpkgmyzeirg.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', 'sb_publishable_JYoKPSYwVis9oM8j6tA7Og_d9t2EHgB')  # Service role key gerekli

def load_json_data(file_path: str) -> list:
    """JSON dosyasını yükle"""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data

def transform_record(record: dict) -> dict:
    """JSON kaydını Supabase formatına dönüştür"""
    return {
        'sira_no': record.get('SIRA NO'),
        'ders_adi': record.get('DERS ADI', ''),
        'unite_tema': record.get('ÜNİTE/TEMA/ ÖĞRENME ALANI', ''),
        'kazanim': record.get('KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM', ''),
        'e_icerik_turu': record.get('E-İÇERİK TÜRÜ', ''),
        'aciklama': record.get('AÇIKLAMA', ''),
        'program_turu': record.get('Program Türü', '')
    }

def migrate_data(supabase: Client, data: list, batch_size: int = 100):
    """Veriyi Supabase'e batch halinde yükle"""
    total = len(data)
    uploaded = 0
    errors = []
    
    # DERS ADI satırlarını filtrele (bunlar başlık satırları)
    filtered_data = [r for r in data if r.get('DERS ADI') != 'DERS ADI']
    
    print(f"Toplam {len(filtered_data)} kayıt yüklenecek (filtreleme sonrası)")
    
    for i in range(0, len(filtered_data), batch_size):
        batch = filtered_data[i:i + batch_size]
        transformed_batch = [transform_record(r) for r in batch]
        
        try:
            result = supabase.table('e_icerikler').insert(transformed_batch).execute()
            uploaded += len(batch)
            print(f"İlerleme: {uploaded}/{len(filtered_data)} ({100*uploaded//len(filtered_data)}%)")
        except Exception as e:
            errors.append({
                'batch_start': i,
                'error': str(e)
            })
            print(f"Hata (batch {i}): {e}")
    
    return uploaded, errors

def create_sample_users(supabase: Client):
    """Örnek kullanıcılar oluştur (test için)"""
    # NOT: Gerçek kullanıcılar Supabase Auth üzerinden oluşturulmalı
    # Bu sadece profiles tablosuna örnek veri ekler
    
    sample_users = [
        {
            'tc_kimlik': '12345678901',
            'ad_soyad': 'Admin Kullanıcı',
            'email': 'admin@example.com',
            'rol': 'admin',
            'ders_alani': None
        },
        {
            'tc_kimlik': '12345678902',
            'ad_soyad': 'Fizik Komisyon Başkanı',
            'email': 'fizik.baskan@example.com',
            'rol': 'chairman',
            'ders_alani': 'Fizik'
        },
        {
            'tc_kimlik': '12345678903',
            'ad_soyad': 'Fizik Editör 1',
            'email': 'fizik.editor1@example.com',
            'rol': 'editor',
            'ders_alani': 'Fizik'
        }
    ]
    
    print("\nÖrnek kullanıcı bilgileri (NOT: Bunları Supabase Auth ile oluşturmanız gerekir):")
    for user in sample_users:
        print(f"  - TC: {user['tc_kimlik']}, Şifre: {user['ad_soyad'][:5].lower()}, Rol: {user['rol']}")
    
    return sample_users

def main():
    # Supabase bağlantısı
    if SUPABASE_URL == 'YOUR_SUPABASE_URL':
        print("HATA: Lütfen SUPABASE_URL ve SUPABASE_KEY değerlerini ayarlayın!")
        print("Environment variable olarak ayarlayabilirsiniz:")
        print("  set SUPABASE_URL=https://xxx.supabase.co")
        print("  set SUPABASE_SERVICE_KEY=eyJ...")
        return
    
    print("Supabase'e bağlanılıyor...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # JSON verisini yükle
    print("JSON verisi yükleniyor...")
    data = load_json_data('data.json')
    print(f"Toplam {len(data)} kayıt bulundu")
    
    # Veriyi migrate et
    print("\nVeri Supabase'e aktarılıyor...")
    uploaded, errors = migrate_data(supabase, data)
    
    print(f"\n{'='*50}")
    print(f"Migrasyon tamamlandı!")
    print(f"Başarıyla yüklenen: {uploaded}")
    print(f"Hata sayısı: {len(errors)}")
    
    if errors:
        print("\nHatalar:")
        for err in errors:
            print(f"  - Batch {err['batch_start']}: {err['error']}")
    
    # Örnek kullanıcı bilgilerini göster
    create_sample_users(supabase)

if __name__ == '__main__':
    main()
