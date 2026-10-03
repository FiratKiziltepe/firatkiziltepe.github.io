<?php
declare(strict_types=1);

function login(array $body): array {
    $username = trim((string)($body['username']??''));
    $password = (string)($body['password']??'');
    $key = hash('sha256', ($_SERVER['REMOTE_ADDR']??'').'|'.strtolower($username));
    return transaction(function() use ($key,$username,$password) {
        sql('INSERT IGNORE INTO login_attempts (attempt_key) VALUES (?)',[$key]);
        $attempt = sql('SELECT *, TIMESTAMPDIFF(SECOND,window_started,UTC_TIMESTAMP()) AS elapsed FROM login_attempts WHERE attempt_key=? FOR UPDATE',[$key])->fetch();
        if ((int)$attempt['elapsed']>=900) sql('UPDATE login_attempts SET attempts=0,window_started=UTC_TIMESTAMP() WHERE attempt_key=?',[$key]);
        elseif ((int)$attempt['attempts']>=10) return ['error'=>'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.','status'=>429];
        $user = sql('SELECT * FROM profiles WHERE kullanici_adi=?',[$username])->fetch();
        // Perform an expensive hash check for missing users as well.
        $valid = password_verify($password, $user['password_hash']??'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.');
        if (!$user || !$valid || !$user['active']) {
            sql('UPDATE login_attempts SET attempts=attempts+1 WHERE attempt_key=?',[$key]);
            return ['error'=>'Kullanıcı adı veya şifre hatalı ya da hesap pasif.','status'=>401];
        }
        sql('DELETE FROM login_attempts WHERE attempt_key=?',[$key]);
        session_regenerate_id(true);
        $_SESSION=['uid'=>$user['id'],'version'=>(int)$user['auth_version'],'csrf'=>bin2hex(random_bytes(32)),'last_seen'=>time()];
        return ['session'=>session_payload($user)];
    });
}
function create_user(array $body, ?array $actor, bool $setup=false): array {
    if (!$setup) require_admin($actor);
    $username = trim((string)($body['kullanici_adi']??''));
    $name = trim((string)($body['ad_soyad']??''));
    $password = (string)($body['sifre']??'');
    $role = $setup ? 'admin' : ($body['rol']??'teacher');
    if (!preg_match('/^[a-zA-Z0-9_.-]{1,190}$/D',$username) || !$name || strlen($name)>255) fail('Kullanıcı adı veya ad soyad geçersiz.');
    validate_password($password, $setup ? 12 : 6);
    if (!in_array($role,['admin','moderator','teacher'],true)) fail('Geçersiz rol.');
    $lessons=$body['atanan_dersler']??[];
    validate_lessons($lessons);
    $user=insert_row('profiles',[
        'id'=>uuid(),'kullanici_adi'=>$username,'ad_soyad'=>$name,'brans'=>(string)($body['brans']??''),'rol'=>$role,
        'atanan_dersler'=>json_encode($lessons,JSON_UNESCAPED_UNICODE),'password_hash'=>password_hash($password,PASSWORD_DEFAULT),'sifre_degistirildi'=>$setup ? 1 : 0,
    ]);
    if ($actor) audit($actor,'kullanici_olusturuldu',"$username kullanıcısı oluşturuldu.");
    return ['user'=>public_row($user)];
}
function validate_lessons(mixed $lessons): void {
    if (!is_array($lessons) || count($lessons)>1000) fail('Ders listesi geçersiz.');
    foreach ($lessons as $lesson) if (!is_string($lesson) || !$lesson || strlen($lesson)>255) fail('Ders adı geçersiz.');
}
function manage_password(array $body,array $actor): array {
    $action=$body['action']??'';
    if ($action==='change_own_password') {
        $password=(string)($body['new_password']??''); validate_password($password);
        update_row('profiles',$actor['id'],['password_hash'=>password_hash($password,PASSWORD_DEFAULT),'sifre_degistirildi'=>1,'auth_version'=>(int)$actor['auth_version']+1]);
        $_SESSION['version']=(int)$actor['auth_version']+1;
        session_regenerate_id(true);
        audit($actor,'sifre_degistirildi','Kullanıcı kendi şifresini değiştirdi.');
        return ['success'=>true];
    }
    require_admin($actor);
    if ($action==='admin_change_password') {
        $password=(string)($body['new_password']??''); validate_password($password);
        $target=sql('SELECT * FROM profiles WHERE id=?',[$body['user_id']??''])->fetch();
        if (!$target) fail('Kullanıcı bulunamadı.',404);
        update_row('profiles',$target['id'],['password_hash'=>password_hash($password,PASSWORD_DEFAULT),'sifre_degistirildi'=>0,'auth_version'=>(int)$target['auth_version']+1]);
        if ($target['id']===$actor['id']) $_SESSION['version']=(int)$target['auth_version']+1;
        audit($actor,'sifre_sifirlandi',$target['kullanici_adi'].' kullanıcısının şifresi sıfırlandı.');
        return ['success'=>true];
    }
    if ($action==='reset_all_passwords') {
        $users=sql('SELECT * FROM profiles')->fetchAll();
        foreach ($users as $target) {
            update_row('profiles',$target['id'],['password_hash'=>password_hash($target['kullanici_adi'],PASSWORD_DEFAULT),'sifre_degistirildi'=>0,'auth_version'=>(int)$target['auth_version']+1]);
            if ($target['id']===$actor['id']) $_SESSION['version']=(int)$target['auth_version']+1;
        }
        audit($actor,'toplu_sifre_sifirlandi','Tüm kullanıcıların şifreleri kullanıcı adlarına sıfırlandı.');
        return ['updated'=>count($users),'total'=>count($users),'errors'=>[]];
    }
    fail('Geçersiz şifre işlemi.');
}
function manage_status(array $body,array $actor): array {
    require_admin($actor);
    if (($body['p_action']??'')==='list') {
        $statuses=[];
        foreach (sql('SELECT id, active FROM profiles')->fetchAll() as $row) $statuses[$row['id']]=(bool)$row['active'];
        return ['statuses'=>$statuses];
    }
    if (($body['p_action']??'')!=='set' || !is_bool($body['p_active']??null)) fail('Geçersiz durum işlemi.');
    $active=$body['p_active']; $id=$body['p_user_id']??null;
    if ($id===$actor['id']) fail('Kendi hesabınız bu işlemden hariçtir.',403);
    $users=$id ? sql('SELECT * FROM profiles WHERE id=?',[$id])->fetchAll() : sql('SELECT * FROM profiles WHERE id<>?',[$actor['id']])->fetchAll();
    if ($id && !$users) fail('Kullanıcı bulunamadı.',404);
    foreach ($users as $target) {
        preserve_admin($target,$target['rol'],$active);
        update_row('profiles',$target['id'],['active'=>(int)$active,'auth_version'=>(int)$target['auth_version']+1]);
    }
    audit($actor,'kullanici_erisim_degisti',count($users).' hesap '.($active?'aktif':'pasif').' yapıldı.');
    return ['updated'=>count($users),'errors'=>[]];
}
