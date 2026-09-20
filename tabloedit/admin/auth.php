<?php
/**
 * Kimlik Doğrulama Fonksiyonları
 */

require_once __DIR__ . '/config.php';

/**
 * Kullanıcı girişi
 */
function loginUser(string $username, string $password): bool {
    $pdo = getDB();
    
    $stmt = $pdo->prepare("SELECT id, username, password_hash FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password_hash'])) {
        session_start();
        regenerateSession();
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['login_time'] = time();
        
        // Audit log
        logAction('LOGIN', null, null, null);
        
        return true;
    }
    
    return false;
}

/**
 * Kullanıcı çıkışı
 */
function logoutUser(): void {
    session_start();
    
    if (!empty($_SESSION['user_id'])) {
        logAction('LOGOUT', null, null, null);
    }
    
    $_SESSION = [];
    
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'],
            $params['secure'], $params['httponly']
        );
    }
    
    session_destroy();
}

/**
 * Şifre değiştir
 */
function changePassword(int $userId, string $currentPassword, string $newPassword): bool {
    $pdo = getDB();
    
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
        return false;
    }
    
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $stmt->execute([$newHash, $userId]);
    
    logAction('PASSWORD_CHANGE', null, null, null);
    
    return true;
}

/**
 * Audit log kaydı
 */
function logAction(string $action, ?int $recordId, ?array $oldData, ?array $newData): void {
    $pdo = getDB();
    
    $userId = $_SESSION['user_id'] ?? null;
    $username = $_SESSION['username'] ?? 'system';
    
    $stmt = $pdo->prepare("
        INSERT INTO audit_log (user_id, username, action, record_id, old_data, new_data)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $userId,
        $username,
        $action,
        $recordId,
        $oldData ? json_encode($oldData, JSON_UNESCAPED_UNICODE) : null,
        $newData ? json_encode($newData, JSON_UNESCAPED_UNICODE) : null
    ]);
}

/**
 * Oturumdaki kullanıcı bilgisi
 */
function getCurrentUser(): ?array {
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    
    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username']
    ];
}

