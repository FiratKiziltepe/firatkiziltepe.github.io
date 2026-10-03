<?php
declare(strict_types=1);

function table_columns(string $table): array {
    $common=['id','user_id','durum','onaylayan_id','red_nedeni','created_at','onay_tarihi'];
    return match($table) {
        'profiles'=>['id','kullanici_adi','ad_soyad','brans','rol','atanan_dersler','sifre_degistirildi','created_at','updated_at'],
        'e_icerikler'=>['id','sira_no',...content_fields(),'created_at','updated_at'],
        'degisiklik_onerileri'=>[...$common,'e_icerik_id','alan','eski_deger','yeni_deger','gerekce'],
        'yeni_satir_onerileri'=>[...$common,...content_fields(),'gerekce'],
        'silme_talepleri'=>[...$common,'e_icerik_id','aciklama'],
        'degisiklik_loglari'=>['id','user_id','e_icerik_id','islem_tipi','alan','eski_deger','yeni_deger','aciklama','created_at'],
        default=>throw new ApiError('Geçersiz tablo.'),
    };
}
function query_where(string $table,array $body,array $user): array {
    $clauses=[]; $params=[];
    if (!is_array($body['filters']??[]) || count($body['filters']??[])>20) fail('Geçersiz filtre.');
    foreach ($body['filters']??[] as $filter) {
        $column=$filter['column']??'';
        if (!in_array($column,table_columns($table),true)) fail('Geçersiz filtre alanı.');
        $value=$filter['value']??null;
        $operator=$filter['operator']??'';
        if ($operator==='in') {
            if (!is_array($value) || count($value)>1000) fail('Geçersiz filtre değerleri.');
            foreach ($value as $item) if (!is_scalar($item)) fail('Geçersiz filtre değeri.');
            $clauses[]=$value ? '`t`.`'.$column.'` IN ('.implode(',',array_fill(0,count($value),'?')).')' : '1=0';
            array_push($params,...$value);
        } elseif (in_array($operator,['eq','neq'],true) && is_scalar($value)) {
            $clauses[]='`t`.`'.$column.'` '.($operator==='eq'?'=':'<>').' ?'; $params[]=$value;
        } else fail('Geçersiz filtre işlemi.');
    }
    if ($user['rol']!=='admin' && $table!=='profiles') {
        $lessons=json_decode($user['atanan_dersler'],true);
        $slots=implode(',',array_fill(0,count($lessons),'?'));
        if ($table==='degisiklik_loglari') {
            $clauses[]='t.user_id = ?'; $params[]=$user['id'];
        } elseif (!$lessons) $clauses[]='1=0';
        elseif (in_array($table,['e_icerikler','yeni_satir_onerileri'],true)) {
            $clauses[]="t.ders_adi IN ($slots)"; array_push($params,...$lessons);
        } else {
            $clauses[]="EXISTS (SELECT 1 FROM e_icerikler c WHERE c.id=t.e_icerik_id AND c.ders_adi IN ($slots))";
            array_push($params,...$lessons);
        }
    }
    return [$clauses?' WHERE '.implode(' AND ',$clauses):'', $params];
}
function selected_rows(string $table,array $body,array $user,bool $forWrite=false): array {
    [$where,$params]=query_where($table,$body,$user);
    $order=$body['order']??['column'=>'id','ascending'=>true];
    if (!in_array($order['column']??'',table_columns($table),true)) fail('Geçersiz sıralama alanı.');
    $limit=(int)($body['limit']??5000); $offset=(int)($body['offset']??0);
    if ($limit<1 || $limit>10000 || $offset<0) fail('Geçersiz sayfalama.');
    $sort=' ORDER BY t.`'.$order['column'].'` '.(($order['ascending']??true)?'ASC':'DESC');
    if ($order['column']!=='id') $sort.=', t.id ASC';
    return sql("SELECT t.* FROM `$table` t".$where.$sort.($forWrite?'':" LIMIT $limit OFFSET $offset"),$params)->fetchAll();
}
function query_api(array $body,array $user): mixed {
    $table=(string)($body['table']??''); table_columns($table);
    $operation=$body['operation']??'select';
    if ($operation==='select') {
        $rows=array_map('public_row',selected_rows($table,$body,$user));
        if ($table==='profiles' && $user['rol']!=='admin') {
            foreach ($rows as &$row) if ($row['id']!==$user['id']) {
                $row['atanan_dersler']=[];
                unset($row['sifre_degistirildi']);
            }
            unset($row);
        }
        if ($body['single']??false) { if (count($rows)!==1) fail('Tek kayıt bulunamadı.',404); return $rows[0]; }
        return $rows;
    }
    if (!in_array($operation,['insert','update','delete'],true)) fail('Geçersiz işlem.');
    if ($operation==='insert') {
        $values=$body['values']??null;
        if (!is_array($values) || !$values) fail('Kayıt verisi eksik.');
        $batch=array_is_list($values)?$values:[$values];
        if (count($batch)>500) fail('Tek istekte en fazla 500 kayıt eklenebilir.');
        $rows=[];
        foreach ($batch as $value) $rows[]=public_row(insert_validated($table,$value,$user));
    } else {
        // Only administrators may operate on a collection; other users must target an explicit id.
        $hasId=false;
        foreach ($body['filters']??[] as $filter) if (($filter['column']??'')==='id' && ($filter['operator']??'')==='eq') $hasId=true;
        if (!$hasId && $user['rol']!=='admin') fail('İşlem için kayıt kimliği gerekir.',403);
        if (empty($body['filters'])) fail('Filtresiz toplu işlem desteklenmiyor.');
        $targets=selected_rows($table,$body,$user,true);
        if ($hasId && !$targets) fail('Kayıt bulunamadı veya yetkiniz yok.',404);
        $rows=[];
        foreach ($targets as $target) {
            mutate_validated($table,$operation,$target,$body['values']??[],$user);
            if ($operation==='update') $rows[]=public_row(sql("SELECT * FROM `$table` WHERE id=?",[$target['id']])->fetch());
        }
        if ($user['rol']==='admin' && count($targets)>1) audit($user,'toplu_islem',"$table: $operation, ".count($targets).' kayıt.');
    }
    if ($body['single']??false) { if (count($rows)!==1) fail('Tek kayıt bulunamadı.'); return $rows[0]; }
    return ($body['returning']??false)?$rows:null;
}
function insert_validated(string $table,array $value,array $user): array {
    if ($table==='profiles') fail('Kullanıcı oluşturma işlemini kullanın.',403);
    if ($table==='e_icerikler') {
        require_admin($user);
        $value=text_fields($value,['sira_no',...content_fields()]);
        if (empty($value['ders_adi'])) fail('Ders adı gerekli.');
        $value=['sira_no'=>1,...array_fill_keys(content_fields(),''),...$value];
        return insert_row($table,$value);
    }
    if ($table==='degisiklik_loglari') {
        $value=text_fields($value,['user_id','islem_tipi','aciklama','e_icerik_id']);
        $value['user_id']=$user['id'];
        if (!empty($value['e_icerik_id'])) content($user,$value['e_icerik_id']);
        return insert_row($table,$value);
    }
    $allowed=match($table) {
        'degisiklik_onerileri'=>['user_id','e_icerik_id','alan','eski_deger','yeni_deger','gerekce'],
        'yeni_satir_onerileri'=>['user_id',...content_fields(),'gerekce'],
        'silme_talepleri'=>['user_id','e_icerik_id','aciklama'],
    };
    $value=text_fields($value,$allowed); $value['user_id']=$user['id'];
    if ($table==='yeni_satir_onerileri') {
        require_lesson($user,(string)($value['ders_adi']??''));
        if (empty($value['ders_adi'])) fail('Ders adı gerekli.');
        $value=[...array_fill_keys(content_fields(),''),...$value];
    } else {
        $row=content($user,$value['e_icerik_id']??0);
        if ($table==='degisiklik_onerileri') {
            if (!in_array($value['alan']??'',content_fields(),true)) fail('Geçersiz değişiklik alanı.');
            if (!array_key_exists('yeni_deger',$value)) fail('Yeni değer gerekli.');
            if ($value['alan']==='ders_adi') require_lesson($user,(string)$value['yeni_deger']);
            $value['eski_deger']=$row[$value['alan']];
        }
    }
    return insert_row($table,$value);
}
function mutate_validated(string $table,string $operation,array $target,array $value,array $user): void {
    if (in_array($table,['profiles','e_icerikler','degisiklik_loglari'],true)) {
        require_admin($user);
        if ($table==='profiles') {
            if ($operation==='delete') fail('Hesap silmek yerine pasif yapın.',403);
            $allowed=['ad_soyad','brans','rol','atanan_dersler'];
            foreach (array_keys($value) as $key) if (!in_array($key,$allowed,true)) fail('Geçersiz profil alanı.');
            foreach (['ad_soyad','brans','rol'] as $key) {
                if (array_key_exists($key,$value) && (!is_string($value[$key]) || strlen($value[$key])>255 || ($key==='ad_soyad' && trim($value[$key])===''))) fail('Geçersiz profil değeri.');
            }
            if (isset($value['rol'])) {
                if (!in_array($value['rol'],['admin','moderator','teacher'],true)) fail('Geçersiz rol.');
                preserve_admin($target,$value['rol'],(bool)$target['active']);
            }
            if (isset($value['atanan_dersler'])) { validate_lessons($value['atanan_dersler']); $value['atanan_dersler']=json_encode($value['atanan_dersler'],JSON_UNESCAPED_UNICODE); }
            update_row($table,$target['id'],$value);
            audit($user,'kullanici_guncellendi',$target['kullanici_adi'].' bilgileri güncellendi.');
            return;
        }
        if ($operation==='delete') {
            if ($table==='e_icerikler') reject_related((int)$target['id'],$user,'İçerik yönetici tarafından silindi.');
            sql("DELETE FROM `$table` WHERE id=?",[$target['id']]); return;
        }
        if ($table==='degisiklik_loglari') fail('Geçmiş kayıtları düzenlenemez.',403);
        $value=text_fields($value,['sira_no',...content_fields()]);
        update_row($table,$target['id'],$value); return;
    }
    $moderates=in_array($user['rol'],['admin','moderator'],true);
    if ($target['durum']!=='pending') {
        if ($operation==='delete' && $user['rol']==='admin') { sql("DELETE FROM `$table` WHERE id=?",[$target['id']]); return; }
        fail('Yalnızca bekleyen talepler değiştirilebilir.',409);
    }
    if (!$moderates && $target['user_id']!==$user['id']) fail('Yalnızca kendi talebinizi değiştirebilirsiniz.',403);
    if ($table==='yeni_satir_onerileri') require_lesson($user,$target['ders_adi']);
    else content($user,$target['e_icerik_id']);
    if ($operation==='delete') { sql("DELETE FROM `$table` WHERE id=?",[$target['id']]); return; }
    $allowed=$table==='degisiklik_onerileri'?['yeni_deger','gerekce']:($table==='yeni_satir_onerileri'?[...content_fields(),'gerekce']:['aciklama']);
    $value=text_fields($value,$allowed);
    if (isset($value['ders_adi'])) require_lesson($user,$value['ders_adi']);
    if ($table==='degisiklik_onerileri' && $target['alan']==='ders_adi' && isset($value['yeni_deger'])) require_lesson($user,$value['yeni_deger']);
    update_row($table,$target['id'],$value);
}
