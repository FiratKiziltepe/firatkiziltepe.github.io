<?php
declare(strict_types=1);
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Content-Security-Policy: frame-ancestors \'none\'');
?>
<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NAS kurulumu</title>
<style>body{font:16px system-ui;background:#f1f5f9;color:#0f172a;margin:0;padding:32px}main{max-width:560px;margin:auto;background:white;border-radius:24px;padding:32px}label{display:block;margin:18px 0}input:not([type=checkbox]){display:block;box-sizing:border-box;width:100%;padding:12px;margin-top:6px;border:1px solid #cbd5e1;border-radius:8px}button{padding:12px 24px;border:0;border-radius:8px;background:#2563eb;color:white;font-weight:bold}#result{white-space:pre-wrap;line-height:1.5}</style></head>
<body><main><h1>Tablo Görüşler · NAS kurulumu</h1><p>Veritabanı bağlantısını önce <code>server/config.php</code> dosyasında tanımlayın. Bu sayfa yalnızca ilk yönetici hesabını oluşturur; kullanıcı varsa tekrar çalışmaz.</p>
<form id="setup"><label>Kurulum anahtarı<input name="token" type="password" required minlength="24" autocomplete="off"></label>
<label>Yönetici kullanıcı adı<input name="kullanici_adi" required pattern="[a-zA-Z0-9_.\-]+" value="admin" autocomplete="username"></label>
<label>Ad soyad<input name="ad_soyad" required></label>
<label>Yönetici şifresi (en az 12 karakter)<input name="sifre" type="password" minlength="12" maxlength="72" required autocomplete="new-password"></label>
<label><input name="import_initial" type="checkbox" checked> Projedeki başlangıç içeriklerini aktar</label>
<p>Bu seçenek klasördeki veri dosyasını aktarır. Canlı sistemin güncel kullanıcı, öneri ve geçmiş kayıtlarını içermez.</p>
<button type="submit">Kurulumu tamamla</button></form><p id="result" role="status"></p></main>
<script>
document.querySelector('#setup').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form=event.target;const button=form.querySelector('button');button.disabled=true;
  const values=Object.fromEntries(new FormData(form));values.import_initial=form.elements.import_initial.checked;
  const output=document.querySelector('#result');output.textContent='Kurulum ve veri aktarımı yapılıyor...';
  try {
    const response=await fetch('./api/index.php?action=setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});
    const result=await response.json();if(!response.ok)throw new Error(result.error);
    output.textContent=`Kurulum tamamlandı. ${result.imported} içerik aktarıldı. `;
    const link=document.createElement('a');link.href='./';link.textContent='Uygulamayı aç';output.append(link);
    form.remove();
  } catch(error){output.textContent=error.message;button.disabled=false;}
});
</script></body></html>
