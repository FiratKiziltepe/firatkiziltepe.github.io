<?php
declare(strict_types=1);
function import_content(array $body,array $user): array {
    require_admin($user);
    $rows=$body['rows']??null;
    if (!is_array($rows) || !array_is_list($rows) || !$rows || count($rows)>10000) fail('1–10000 içerik satırı gerekir.');
    if (!in_array($body['mode']??'',['append','replace'],true)) fail('Geçersiz aktarım modu.');
    if ($body['mode']==='replace') {
        foreach (['degisiklik_onerileri','yeni_satir_onerileri','silme_talepleri','degisiklik_loglari','e_icerikler'] as $table) sql("DELETE FROM `$table`");
    }
    foreach ($rows as $row) {
        if (!is_array($row)) fail('Geçersiz içerik satırı.');
        insert_validated('e_icerikler',$row,$user);
    }
    audit($user,'veri_aktarimi',count($rows).' içerik aktarıldı; mod: '.$body['mode']);
    return ['inserted'=>count($rows)];
}
function reset_proposals(array $user): array {
    require_admin($user);
    foreach (['degisiklik_onerileri','yeni_satir_onerileri','silme_talepleri','degisiklik_loglari'] as $table) sql("DELETE FROM `$table`");
    audit($user,'talepler_sifirlandi','Öneriler, silme talepleri ve işlem geçmişi sıfırlandı.');
    return ['success'=>true];
}
