<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
require __DIR__.'/../../server/bootstrap.php';
require __DIR__.'/../../server/auth.php';
require __DIR__.'/../../server/queries.php';
require __DIR__.'/../../server/proposals.php';
require __DIR__.'/../../server/setup.php';
require __DIR__.'/../../server/import.php';
try {
    if (($_SERVER['REQUEST_METHOD']??'')!=='POST') fail('POST yöntemi gerekir.',405);
    if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE']??''),'application/json')) fail('JSON isteği gerekir.',415);
    $origin=$_SERVER['HTTP_ORIGIN']??null;
    if ($origin && parse_url($origin,PHP_URL_HOST).(parse_url($origin,PHP_URL_PORT)?':'.parse_url($origin,PHP_URL_PORT):'') !== ($_SERVER['HTTP_HOST']??'')) fail('İstek kaynağı geçersiz.',403);
    if ((int)($_SERVER['CONTENT_LENGTH']??0)>8*1024*1024) fail('İstek en fazla 8 MB olabilir.',413);
    $body=json_decode(file_get_contents('php://input'),true,512,JSON_THROW_ON_ERROR);
    if (!is_array($body) || (array_is_list($body) && $body)) fail('JSON nesnesi gerekir.');
    $action=$_GET['action']??'';
    start_session();
    if ($action==='setup') $result=setup($body);
    elseif ($action==='login') {
        $result=login($body);
        if (isset($result['error'])) { http_response_code($result['status']); unset($result['status']); }
    } elseif ($action==='session') {
        $result=['session'=>empty($_SESSION['uid'])?null:session_payload(authenticated())];
    } else {
        $user=authenticated();
        $csrf=$_SERVER['HTTP_X_CSRF_TOKEN']??'';
        if (!$csrf || !hash_equals($_SESSION['csrf'],$csrf)) fail('Oturum doğrulaması başarısız. Sayfayı yenileyin.',403);
        if (!$user['sifre_degistirildi'] && !in_array($action,['manage-password','logout'],true) && !($action==='query' && ($body['table']??'')==='profiles' && ($body['operation']??'')==='select')) fail('Önce şifrenizi değiştirin.',403);
        $result=match($action) {
            'logout'=>(function() { clear_session(); return ['success'=>true]; })(),
            'query'=>($body['operation']??'select')==='select' ? query_api($body,$user) : transaction(fn()=>query_api($body,$user)),
            'create-user'=>transaction(fn()=>create_user($body,$user)),
            'manage-password'=>transaction(fn()=>manage_password($body,$user)),
            'manage_user_status'=>transaction(fn()=>manage_status($body,$user)),
            'resolve-proposal'=>transaction(fn()=>resolve_proposal($body,$user)),
            'import-content'=>transaction(fn()=>import_content($body,$user)),
            'reset-proposals'=>transaction(fn()=>reset_proposals($user)),
            default=>throw new ApiError('API işlemi bulunamadı.',404),
        };
    }
    echo json_encode($result,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    $status=$error instanceof ApiError?$error->status:500;
    $message=$error instanceof ApiError?$error->getMessage():'Sunucu işlemi tamamlanamadı. NAS hata günlüğünü kontrol edin.';
    if ($error instanceof JsonException) { $status=400; $message='Geçersiz JSON verisi.'; }
    if ($error instanceof PDOException && ($error->errorInfo[1]??0)===1062) { $status=409; $message='Bu kullanıcı adı veya kayıt zaten mevcut.'; }
    if ($error instanceof mysqli_sql_exception) {
        if ($error->getCode()===1062) { $status=409; $message='Bu kullanıcı adı veya kayıt zaten mevcut.'; }
        elseif ($error->getCode()===1146) { $status=503; $message='Tablolar henüz oluşturulmamış. phpMyAdmin içinde tablogorusler veritabanını seçip phpmyadmin-kurulum.sql dosyasını içe aktarın.'; }
        elseif (in_array($error->getCode(),[1045,1049,2002,2003],true)) { $status=503; $message='Veritabanına bağlanılamadı. baglan.php içindeki kullanıcı, şifre ve veritabanı adını kontrol edin.'; }
    }
    if ($status===500) error_log((string)$error);
    http_response_code($status);
    echo json_encode(['error'=>$message],JSON_UNESCAPED_UNICODE);
}
