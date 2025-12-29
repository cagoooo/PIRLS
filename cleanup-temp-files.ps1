# PIRLS 臨時檔案清理腳本
# 執行前建議先備份整個專案

Write-Host "🗑️  開始清理臨時檔案..." -ForegroundColor Cyan
Write-Host ""

$filesToDelete = @(
    "fix-mobile-button-styles.js",
    "fix-desktop-user-info.js",
    "fix-double-encoding.js",
    "fix-mobile-buttons.js",
    "fix-mobile-inline-styles.js",
    "fix-quiz-css-encoding.ps1",
    "fix-quiz-css.js",
    "fix-css-encoding.js",
    "check-css.js",
    "analyze-encoding.js",
    "css_additions.txt",
    "fix-filter.sh",
    "assets\css\quiz.css.backup",
    "assets\css\quiz_temp.css"
)

$deletedCount = 0
$notFoundCount = 0

foreach ($file in $filesToDelete) {
    $fullPath = Join-Path "h:\PIRLS" $file
    
    if (Test-Path $fullPath) {
        try {
            Remove-Item $fullPath -Force
            Write-Host "✅ 已刪除: $file" -ForegroundColor Green
            $deletedCount++
        } catch {
            Write-Host "❌ 刪除失敗: $file - $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  檔案不存在: $file" -ForegroundColor Yellow
        $notFoundCount++
    }
}

Write-Host ""
Write-Host "📊 清理完成！" -ForegroundColor Cyan
Write-Host "   已刪除: $deletedCount 個檔案" -ForegroundColor Green
Write-Host "   未找到: $notFoundCount 個檔案" -ForegroundColor Yellow
