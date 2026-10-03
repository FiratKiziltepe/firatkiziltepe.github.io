<?php
declare(strict_types=1);
function setup(array $body): array {
    $token=(string)(config()['setup_token']??'');
    if (strlen($token)<24 || str_starts_with($token,'BURAYA_') || !hash_equals($token,(string)($body['token']??''))) fail('Kurulum anahtarı geçersiz.',403);
    db()->exec(file_get_contents(__DIR__.'/../database/schema.sql'));
    return transaction(function() use ($body) {
        if ((int)sql('SELECT COUNT(*) FROM profiles')->fetchColumn()>0) fail('Kurulum zaten tamamlanmış. Kurulum tekrar çalıştırılamaz.',409);
        $result=create_user($body,null,true);
        $count=0;
        if ($body['import_initial']??false) {
            if ((int)sql('SELECT COUNT(*) FROM e_icerikler')->fetchColumn()>0) fail('İçerik tablosu boş değil; başlangıç verisi eklenmedi.',409);
            $rows=json_decode(file_get_contents(__DIR__.'/../database/initial-data.json'),true,512,JSON_THROW_ON_ERROR);
            foreach ($rows as $i=>$row) {
                $lesson=$row['ders_adi']??$row['DERS ADI']??'';
                if (!$lesson || in_array($lesson,['DERS ADI','ders_adi'],true)) continue;
                insert_row('e_icerikler',[
                    'sira_no'=>(int)($row['sira_no']??$row['SIRA NO']??$i+1),
                    'ders_adi'=>$lesson,
                    'unite_tema'=>$row['unite_tema']??$row['ÜNİTE/TEMA/ ÖĞRENME ALANI']??$row['ÜNİTE/TEMA']??'',
                    'kazanim'=>$row['kazanim']??$row['KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM']??$row['KAZANIM/ÇIKTI']??'',
                    'e_icerik_turu'=>$row['e_icerik_turu']??$row['E-İÇERİK TÜRÜ']??'',
                    'aciklama'=>$row['aciklama']??$row['AÇIKLAMA']??'',
                    'program_turu'=>$row['program_turu']??$row['Program Türü']??$row['PROGRAM TÜRÜ']??'TYMM',
                ]); $count++;
            }
        }
        return ['success'=>true,'imported'=>$count,...$result];
    });
}
