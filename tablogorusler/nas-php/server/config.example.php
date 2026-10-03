<?php
declare(strict_types=1);
return [
    'host' => 'localhost',
    'port' => 3306, // NAS MariaDB 10 bazı cihazlarda 3307 kullanır.
    'database' => 'tablogorusler',
    'username' => 'tablogorusler_app',
    'password' => 'BURAYA_VERITABANI_SIFRESI',
    'session_seconds' => 28800,
    'secure_cookies' => false, // HTTPS kullanıldığında true yapın.
    'setup_token' => 'BURAYA_UZUN_RASTGELE_KURULUM_ANAHTARI',
];
