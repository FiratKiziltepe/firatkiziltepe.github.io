<?php
declare(strict_types=1);

function reject_related(int $contentId,array $user,string $reason,?int $exceptChange=null,?string $field=null,?int $exceptDelete=null): void {
    $tables=$field ? ['degisiklik_onerileri'] : ['degisiklik_onerileri','silme_talepleri'];
    foreach ($tables as $table) {
        $params=[$user['id'],$reason,$contentId];
        $where="e_icerik_id=? AND durum='pending'";
        if ($field) { $where.=' AND alan=?'; $params[]=$field; }
        $except=$table==='degisiklik_onerileri'?$exceptChange:$exceptDelete;
        if ($except) { $where.=' AND id<>?'; $params[]=$except; }
        sql("UPDATE `$table` SET durum='rejected', onaylayan_id=?, red_nedeni=?, onay_tarihi=UTC_TIMESTAMP(6) WHERE $where",$params);
    }
}
function resolve_proposal(array $body,array $user): array {
    if (!in_array($user['rol'],['admin','moderator'],true)) fail('Onay için yönetici veya moderatör yetkisi gerekir.',403);
    $table=match($body['type']??'') {
        'degisiklik'=>'degisiklik_onerileri', 'yeni_satir'=>'yeni_satir_onerileri','silme'=>'silme_talepleri',
        default=>throw new ApiError('Geçersiz talep türü.'),
    };
    $status=$body['durum']??'';
    if (!in_array($status,['approved','rejected'],true)) fail('Geçersiz onay durumu.');
    $proposal=sql("SELECT * FROM `$table` WHERE id=? FOR UPDATE",[$body['id']??0])->fetch();
    if (!$proposal) fail('Talep bulunamadı.',404);
    if ($proposal['durum']!=='pending') fail('Bu talep başka bir işlemle sonuçlandırılmış. Listeyi yenileyin.',409);
    if ($table==='yeni_satir_onerileri') require_lesson($user,$proposal['ders_adi']);
    else $row=content($user,$proposal['e_icerik_id']);
    if ($status==='approved') {
        if ($table==='degisiklik_onerileri') {
            $field=$proposal['alan'];
            if (!in_array($field,content_fields(),true)) fail('Geçersiz öneri alanı.');
            if ($field==='ders_adi') require_lesson($user,$proposal['yeni_deger']);
            if ($row[$field]!==$proposal['eski_deger']) fail('İçerik öneriden sonra değişmiş. Güncel değerle yeni öneri oluşturun.',409);
            update_row('e_icerikler',$row['id'],[$field=>$proposal['yeni_deger']]);
            reject_related((int)$row['id'],$user,'Aynı alan için başka bir öneri onaylandı.',(int)$proposal['id'],$field);
        } elseif ($table==='yeni_satir_onerileri') {
            $values=array_intersect_key($proposal,array_flip(content_fields()));
            $values['sira_no']=(int)sql('SELECT COALESCE(MAX(sira_no),0)+1 FROM e_icerikler')->fetchColumn();
            insert_row('e_icerikler',$values);
        } else {
            reject_related((int)$row['id'],$user,'Satır başka bir talep ile silindi.',null,null,(int)$proposal['id']);
            sql('DELETE FROM e_icerikler WHERE id=?',[$row['id']]);
        }
    }
    sql("UPDATE `$table` SET durum=?, onaylayan_id=?, red_nedeni=?, onay_tarihi=UTC_TIMESTAMP(6) WHERE id=?",[$status,$user['id'],$body['red_nedeni']??null,$proposal['id']]);
    audit($user,$status==='approved'?'onaylandi':'reddedildi',($body['type']).' talebi '.($status==='approved'?'onaylandı':'reddedildi'),isset($proposal['e_icerik_id'])?(int)$proposal['e_icerik_id']:null);
    return ['success'=>true];
}
