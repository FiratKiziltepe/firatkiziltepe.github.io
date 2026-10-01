# Build the development entry point and prepare static files for GitHub Pages.
$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot
$previousLocation = Get-Location
$indexPath = Join-Path $projectDir 'index.html'
$devIndexPath = Join-Path $projectDir 'index.dev.html'
$backupPath = Join-Path $projectDir '.index.before-build.html'

try {
    Set-Location -LiteralPath $projectDir
    if (-not (Test-Path -LiteralPath $devIndexPath)) {
        throw 'index.dev.html bulunamadı.'
    }

    Copy-Item -LiteralPath $indexPath -Destination $backupPath -Force
    Copy-Item -LiteralPath $devIndexPath -Destination $indexPath -Force

    Write-Host 'Building project...' -ForegroundColor Cyan
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) {
        throw 'Build failed.'
    }

    $builtIndexPath = Join-Path $projectDir 'dist/index.html'
    $builtAssetsPath = Join-Path $projectDir 'dist/assets'
    if (-not (Test-Path -LiteralPath $builtIndexPath) -or -not (Test-Path -LiteralPath $builtAssetsPath)) {
        throw 'Build çıktıları bulunamadı.'
    }

    $assetsPath = Join-Path $projectDir 'assets'
    New-Item -ItemType Directory -Path $assetsPath -Force | Out-Null
    Copy-Item -Path (Join-Path $builtAssetsPath '*') -Destination $assetsPath -Recurse -Force
    $builtHtml = [System.IO.File]::ReadAllText($builtIndexPath)
    $builtHtml = [regex]::Replace($builtHtml, "`r+`n", "`n").Replace("`r", "`n")
    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($indexPath, $builtHtml, $utf8NoBom)
    [System.IO.File]::WriteAllText((Join-Path $projectDir 'index.prod.html'), $builtHtml, $utf8NoBom)

    Write-Host 'GitHub Pages dosyaları hazır: index.html ve assets/' -ForegroundColor Green
} catch {
    if (Test-Path -LiteralPath $backupPath) {
        Copy-Item -LiteralPath $backupPath -Destination $indexPath -Force
    }
    throw
} finally {
    if (Test-Path -LiteralPath $backupPath) {
        Remove-Item -LiteralPath $backupPath -Force
    }
    Set-Location $previousLocation
}

