<?php
// Bağlantı bilgilerini yalnızca burada değiştirin.
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$host = "localhost";
$user = "root";
$pass = "BURAYA_VERITABANI_SIFRENIZ";
$db   = "tablogorusler";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    throw new RuntimeException("Veritabanına bağlanılamadı.");
}
$conn->set_charset("utf8mb4");
