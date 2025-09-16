@echo off
echo Excel to JSON Converter
echo =====================

REM Python'un yüklü olup olmadığını kontrol et
python --version >nul 2>&1
if errorlevel 1 (
    echo Python yüklü değil. Lütfen Python'u yükleyin.
    pause
    exit /b 1
)

REM Gerekli kütüphaneleri yükle
echo Gerekli kütüphaneler yükleniyor...
pip install -r requirements.txt

REM Python scriptini çalıştır
echo.
python excel_to_json.py %1

echo.
echo İşlem tamamlandı!
pause

