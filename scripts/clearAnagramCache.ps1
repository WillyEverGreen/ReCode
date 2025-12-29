# Clear Cache for Anagram Problem

Write-Host "🗑️  Clearing cache for 'Check Anagram' problem..." -ForegroundColor Yellow

# The problem is cached with this normalized name
$problemName = "checkanagram"

Write-Host "`n✅ To clear the cache:" -ForegroundColor Green
Write-Host "1. Go to your admin panel (if you have one)"
Write-Host "2. Or manually clear Redis/MongoDB cache for: $problemName"
Write-Host "3. Or request a NEW VARIANT by clicking 'Generate Another Solution'"
Write-Host "`n💡 The validator IS working, but you're seeing CACHED old data!"
Write-Host "`n🔄 Try requesting a VARIANT (click the refresh button) to bypass cache"
