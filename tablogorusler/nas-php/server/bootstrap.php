<?php
declare(strict_types=1);
require_once __DIR__.'/mysqli.php';

final class ApiError extends RuntimeException {
    public function __construct(string $message, public readonly int $status = 400) { parent::__construct($message); }
}
function fail(string $message, int $status = 400): never { throw new ApiError($message, $status); }
function config(): array {
    static $config;
    if ($config === null) {
        $path = __DIR__ . '/config.php';
        if (is_file($path)) {
            $config = require $path; // Compatibility with the first package and isolated tests.
        } else {
            if (!extension_loaded('mysqli')) fail('NAS PHP ayarlarında mysqli uzantısını etkinleştirin.',503);
            require __DIR__.'/../public/baglan.php';
            $GLOBALS['nas_connection']=$conn;
            $config=['session_seconds'=>28800,'secure_cookies'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off','setup_token'=>''];
        }
    }
    return $config;
}
function db(): NasDatabase {
    static $db;
    if (!$db) {
        $c = config();
        if (!extension_loaded('mysqli')) fail('NAS PHP ayarlarında mysqli uzantısını etkinleştirin.',503);
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
        $connection=$GLOBALS['nas_connection'] ?? new mysqli($c['host'],$c['username'],$c['password'],$c['database'],(int)$c['port']);
        $connection->set_charset('utf8mb4');
        $db = new NasDatabase($connection);
        $db->exec("SET time_zone = '+00:00'");
    }
    return $db;
}
function sql(string $statement, array $values = []): NasStatement {
    $query = db()->prepare($statement);
    $query->execute($values);
    return $query;
}
function transaction(callable $operation): mixed {
    db()->beginTransaction();
    try {
        // A common row serializes writes, including proposal approval and administrator changes.
        sql('SELECT id FROM app_locks WHERE id = 1 FOR UPDATE');
        $result = $operation();
        db()->commit();
        return $result;
    } catch (Throwable $e) { if (db()->inTransaction()) db()->rollBack(); throw $e; }
}
function uuid(): string {
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 15) | 64);
    $bytes[8] = chr((ord($bytes[8]) & 63) | 128);
    $hex = bin2hex($bytes);
    return substr($hex,0,8).'-'.substr($hex,8,4).'-'.substr($hex,12,4).'-'.substr($hex,16,4).'-'.substr($hex,20);
}
function public_row(array $row): array {
    unset($row['password_hash'], $row['auth_version'], $row['active']);
    if (isset($row['atanan_dersler'])) $row['atanan_dersler'] = json_decode($row['atanan_dersler'], true, 512, JSON_THROW_ON_ERROR);
    if (isset($row['sifre_degistirildi'])) $row['sifre_degistirildi'] = (bool)$row['sifre_degistirildi'];
    foreach (['id','e_icerik_id','sira_no'] as $field) {
        if (isset($row[$field]) && ctype_digit((string)$row[$field])) $row[$field] = (int)$row[$field];
    }
    foreach (['created_at','updated_at','onay_tarihi'] as $field) {
        if (!empty($row[$field])) $row[$field] = str_replace(' ', 'T', $row[$field]).'Z';
    }
    return $row;
}
function insert_row(string $table, array $values): array {
    $columns = array_keys($values);
    sql('INSERT INTO `'.$table.'` (`'.implode('`,`',$columns).'`) VALUES ('.implode(',',array_fill(0,count($columns),'?')).')', array_values($values));
    $id = $values['id'] ?? db()->lastInsertId();
    return sql("SELECT * FROM `$table` WHERE id = ?", [$id])->fetch();
}
function update_row(string $table, mixed $id, array $values): void {
    if (!$values) fail('Güncellenecek alan bulunamadı.');
    sql("UPDATE `$table` SET ".implode(',',array_map(fn($key) => "`$key` = ?", array_keys($values))).' WHERE id = ?', [...array_values($values),$id]);
}
function start_session(): void {
    $c = config();
    ini_set('session.use_strict_mode','1');
    ini_set('session.use_only_cookies','1');
    ini_set('session.gc_maxlifetime',(string)$c['session_seconds']);
    session_name('tablogorusler_nas');
    $path = str_replace('\\','/',dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/index.php')));
    session_set_cookie_params(['lifetime'=>0,'path'=>rtrim($path,'/').'/', 'secure'=>(bool)$c['secure_cookies'], 'httponly'=>true, 'samesite'=>'Strict']);
    session_start();
}
function clear_session(): void { $_SESSION = []; session_regenerate_id(true); }
function authenticated(): array {
    if (empty($_SESSION['uid'])) fail('Oturum bulunamadı. Tekrar giriş yapın.',401);
    $row = sql('SELECT * FROM profiles WHERE id = ?', [$_SESSION['uid']])->fetch();
    if (!$row || !$row['active'] || (int)$row['auth_version'] !== ($_SESSION['version'] ?? 0) || time() - ($_SESSION['last_seen'] ?? 0) > (int)config()['session_seconds']) {
        clear_session(); fail('Oturum sona erdi veya hesap pasif. Tekrar giriş yapın.',401);
    }
    $_SESSION['last_seen'] = time();
    return $row;
}
function session_payload(array $user): array { return ['user'=>['id'=>$user['id']], 'access_token'=>$_SESSION['csrf']]; }
function require_admin(array $user): void { if ($user['rol'] !== 'admin') fail('Bu işlem için yönetici yetkisi gerekir.',403); }
function assigned(array $user, string $lesson): bool {
    return $user['rol'] === 'admin' || in_array($lesson, json_decode($user['atanan_dersler'],true),true);
}
function require_lesson(array $user, string $lesson): void { if (!assigned($user,$lesson)) fail('Bu ders için yetkiniz yok.',403); }
function content(array $user, mixed $id): array {
    $row = sql('SELECT * FROM e_icerikler WHERE id = ?',[$id])->fetch();
    if (!$row) fail('İçerik bulunamadı.',404);
    require_lesson($user,$row['ders_adi']);
    return $row;
}
function content_fields(): array { return ['ders_adi','unite_tema','kazanim','e_icerik_turu','aciklama','program_turu']; }
function text_fields(array $values, array $allowed): array {
    foreach ($values as $key=>$value) {
        if (!in_array($key,$allowed,true)) fail('Geçersiz alan: '.$key);
        if ($value !== null && !is_scalar($value)) fail('Geçersiz alan değeri.');
        if (is_string($value) && strlen($value) > 200000) fail('Alan çok uzun.');
    }
    return $values;
}
function validate_password(string $password, int $minimum = 6): void {
    if (strlen($password)<$minimum || strlen($password)>72) fail("Şifre $minimum–72 karakter olmalıdır.");
}
function audit(array $user, string $type, string $description, ?int $contentId=null, array $details=[]): void {
    insert_row('degisiklik_loglari', ['user_id'=>$user['id'],'islem_tipi'=>$type,'aciklama'=>$description,'e_icerik_id'=>$contentId,...$details]);
}
function preserve_admin(array $target, string $role, bool $active): void {
    if ($target['rol']==='admin' && $target['active'] && ($role!=='admin' || !$active)) {
        if ((int)sql("SELECT COUNT(*) FROM profiles WHERE rol='admin' AND active=1")->fetchColumn()<=1) fail('Son aktif yönetici pasifleştirilemez veya rolü değiştirilemez.',409);
    }
}
