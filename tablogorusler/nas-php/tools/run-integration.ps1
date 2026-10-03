param(
    [string]$PhpExe = '',
    [string]$MysqlExe = 'C:/xampp/mysql/bin/mysql.exe'
)
$ErrorActionPreference = 'Stop'
$nasRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $nasRoot
if (!$PhpExe) { $PhpExe = Join-Path $nasRoot '.runtime/php83/php.exe' }
$dbIni = Join-Path $nasRoot '.runtime/mariadb/my.ini'
if (!(Test-Path -LiteralPath $dbIni) -or !(Get-Content -LiteralPath $dbIni -Raw).Contains('port=33083')) { throw 'Yalnızca .runtime altındaki 33083 portlu izole MariaDB ile test yapılabilir.' }
$configPath = Join-Path $nasRoot 'server/config.php'
if ((Test-Path -LiteralPath $configPath) -and !(Get-Content -LiteralPath $configPath -Raw).Contains('LOCAL TEST ONLY')) { throw 'Gerçek NAS bağlantı ayarı üzerine test ayarı yazılmaz.' }
$databaseName = 'tablogorusler_nas_test_' + [DateTime]::UtcNow.ToString('yyyyMMddHHmmss')
& $MysqlExe --no-defaults --host=127.0.0.1 --port=33083 --user=root "--execute=CREATE DATABASE $databaseName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
if ($LASTEXITCODE -ne 0) { throw 'İzole test veritabanı oluşturulamadı.' }
$token = [Guid]::NewGuid().ToString('N')
$configText = @"
<?php
// LOCAL TEST ONLY. Ignored by Git; excluded from NAS releases.
return ['host'=>'127.0.0.1','port'=>33083,'database'=>'$databaseName',
'username'=>'root','password'=>'','session_seconds'=>28800,'secure_cookies'=>false,
'setup_token'=>'$token'];
"@
Set-Content -LiteralPath $configPath -Value $configText -Encoding utf8NoBOM
$env:NAS_TEST_URL = 'http://127.0.0.1:8083'
$env:NAS_TEST_SETUP_TOKEN = $token
& node --experimental-strip-types --test tests/api.integration.test.mjs
exit $LASTEXITCODE
