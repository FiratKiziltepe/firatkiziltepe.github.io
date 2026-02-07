# Deploy script - Build and prepare for GitHub Pages
Write-Host "Building project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Copying build files..." -ForegroundColor Cyan

# Backup dev index.html if it doesn't exist or if current index.html is dev version
if (-not (Test-Path "index.dev.html") -or (Select-String -Path "index.html" -Pattern "/index.tsx" -Quiet)) {
    Copy-Item -Path "index.html" -Destination "index.dev.html" -Force
    Write-Host "Development index.html backed up" -ForegroundColor Green
}

# Copy assets
if (Test-Path "assets") { Remove-Item -Path "assets" -Recurse -Force }
Copy-Item -Path "dist\assets" -Destination "assets" -Recurse -Force

# Copy production index.html
Copy-Item -Path "dist\index.html" -Destination "index.html" -Force

Write-Host ""
Write-Host "Deploy ready! Files prepared:" -ForegroundColor Green
Write-Host "  - index.html (production)" -ForegroundColor White
Write-Host "  - assets/ (built JS)" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. cd .." -ForegroundColor White
Write-Host "  2. git add tablogorusler/" -ForegroundColor White
Write-Host "  3. git commit -m 'deploy'" -ForegroundColor White
Write-Host "  4. git push" -ForegroundColor White
Write-Host ""
Write-Host "To restore dev mode after push:" -ForegroundColor Yellow
Write-Host "  Copy-Item index.dev.html index.html -Force" -ForegroundColor White

