# Restore development index.html
if (Test-Path "index.dev.html") {
    Copy-Item -Path "index.dev.html" -Destination "index.html" -Force
    Write-Host "Development mode restored!" -ForegroundColor Green
    Write-Host "You can now run: npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "index.dev.html not found. Creating from template..." -ForegroundColor Yellow
    @"
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-İçerik İnceleme Sistemi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gray-50 text-gray-900">
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
</body>
</html>
"@ | Out-File -FilePath "index.html" -Encoding utf8
    Write-Host "Development index.html created!" -ForegroundColor Green
}

