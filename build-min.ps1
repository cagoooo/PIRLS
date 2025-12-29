# PIRLS CSS/JS 壓縮腳本
Write-Host "🔧 開始壓縮 CSS/JS 檔案..." -ForegroundColor Cyan

# 壓縮 CSS
Write-Host "`n📦 壓縮 CSS 檔案..." -ForegroundColor Yellow

npx postcss assets/css/quiz.css -o assets/css/quiz.min.css --use cssnano --no-map
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ quiz.min.css 壓縮完成" -ForegroundColor Green
} else {
    Write-Host "❌ quiz.css 壓縮失敗" -ForegroundColor Red
}

npx postcss assets/css/admin.css -o assets/css/admin.min.css --use cssnano --no-map
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ admin.min.css 壓縮完成" -ForegroundColor Green
} else {
    Write-Host "❌ admin.css 壓縮失敗" -ForegroundColor Red
}

# 壓縮 JS
Write-Host "`n📦 壓縮 JS 檔案..." -ForegroundColor Yellow

npx terser assets/js/quiz.js -o assets/js/quiz.min.js --compress --mangle
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ quiz.min.js 壓縮完成" -ForegroundColor Green
} else {
    Write-Host "❌ quiz.js 壓縮失敗" -ForegroundColor Red
}

npx terser assets/js/mobile-tabs.js -o assets/js/mobile-tabs.min.js --compress --mangle
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ mobile-tabs.min.js 壓縮完成" -ForegroundColor Green
} else {
    Write-Host "❌ mobile-tabs.js 壓縮失敗" -ForegroundColor Red
}

npx terser assets/js/admin.js -o assets/js/admin.min.js --compress --mangle
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ admin.min.js 壓縮完成" -ForegroundColor Green
} else {
    Write-Host "❌ admin.js 壓縮失敗" -ForegroundColor Red
}

npx terser assets/js/auth-helper.js -o assets/js/auth-helper.min.js --compress --mangle
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ auth-helper.min.js 壓縮完成" -ForegroundColor Green
} else {
    Write-Host "❌ auth-helper.js 壓縮失敗" -ForegroundColor Red
}

npx terser assets/js/pagination.js -o assets/js/pagination.min.js --compress --mangle
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ pagination.min.js 壓縮完成" -ForegroundColor Green
} else {
    Write-Host "❌ pagination.js 壓縮失敗" -ForegroundColor Red
}

#顯示檔案大小對比
Write-Host "`n📊 檔案大小對比：" -ForegroundColor Cyan

function Show-FileSize {
    param($original, $minified)
    
    if ((Test-Path $original) -and (Test-Path $minified)) {
        $origSize = (Get-Item $original).Length
        $minSize = (Get-Item $minified).Length
        $reduction = [math]::Round((($origSize - $minSize) / $origSize) * 100, 1)
        
        $origName = Split-Path $original -Leaf
        Write-Host "   $origName"
        Write-Host "   原始: $([math]::Round($origSize/1KB, 1)) KB → 壓縮: $([math]::Round($minSize/1KB, 1)) KB (減少 $reduction%)" -ForegroundColor Green
    }
}

Show-FileSize "assets/css/quiz.css" "assets/css/quiz.min.css"
Show-FileSize "assets/css/admin.css" "assets/css/admin.min.css"
Show-FileSize "assets/js/quiz.js" "assets/js/quiz.min.js"
Show-FileSize "assets/js/mobile-tabs.js" "assets/js/mobile-tabs.min.js"
Show-FileSize "assets/js/admin.js" "assets/js/admin.min.js"
Show-FileSize "assets/js/auth-helper.js" "assets/js/auth-helper.min.js"
Show-FileSize "assets/js/pagination.js" "assets/js/pagination.min.js"

Write-Host "`n✨ 壓縮完成！" -ForegroundColor Green
