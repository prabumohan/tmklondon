# Download images for TMK London site (run from project root)
# Usage: .\scripts\download-images.ps1

$base = "public\static\content"
if (-not (Test-Path $base)) { New-Item -ItemType Directory -Path $base -Force | Out-Null }

# 1. Tamil heritage (already downloaded if header-tamil-heritage.jpg exists)
if (-not (Test-Path "$base\header-tamil-heritage.jpg")) {
    Write-Host "Downloading Tamil heritage image..."
    try {
        Invoke-WebRequest -Uri "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800" -OutFile "$base\header-tamil-heritage.jpg" -UseBasicParsing
        Write-Host "  OK: header-tamil-heritage.jpg"
    } catch { Write-Host "  Skip: $_" }
}

# 2. London skyline for full-page background (optional)
if (-not (Test-Path "$base\background.jpg")) {
    Write-Host "Downloading London skyline..."
    try {
        Invoke-WebRequest -Uri "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1920" -OutFile "$base\background.jpg" -UseBasicParsing -TimeoutSec 30
        Write-Host "  OK: background.jpg"
    } catch { Write-Host "  Skip (run again or add your own): $_" }
}

Write-Host "Done. Check public\static\content\"
