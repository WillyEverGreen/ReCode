# Quick Test Script for ReCode API
# Run this after starting the dev server with: npm run dev:vercel

Write-Host ""
Write-Host "=== ReCode API Test Suite ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if server is responding
Write-Host "[1/4] Testing server availability..." -ForegroundColor Yellow
try {
    $ping = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Server is running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "✗ Server is not responding. Please start it with: npm run dev:vercel" -ForegroundColor Red
    exit 1
}

# Test 2: Health Check
Write-Host ""
Write-Host "[2/4] Testing health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -UseBasicParsing -ErrorAction Stop
    
    $statusColor = "Yellow"
    if ($health.status -eq "ok") {
        $statusColor = "Green"
    }
    Write-Host "Status: $($health.status)" -ForegroundColor $statusColor
    Write-Host "MongoDB: $($health.services.mongodb.status) - $($health.services.mongodb.message)"
    Write-Host "AI Service: $($health.services.ai.status) - $($health.services.ai.message)"
    Write-Host "  Provider: $($health.services.ai.provider), Model: $($health.services.ai.model)"
    Write-Host "Redis: $($health.services.redis.status) - $($health.services.redis.message)"
    
    if ($health.status -eq "ok") {
        Write-Host "✓ All services healthy" -ForegroundColor Green
    } else {
        Write-Host "⚠ Some services degraded (check above)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Health check failed: $_" -ForegroundColor Red
}

# Test 3: Usage API
Write-Host ""
Write-Host "[3/4] Testing usage API..." -ForegroundColor Yellow
try {
    $usage = Invoke-RestMethod -Uri "http://localhost:3000/api/usage" -UseBasicParsing -ErrorAction Stop
    
    if ($usage.success) {
        Write-Host "✓ Usage API working" -ForegroundColor Green
        Write-Host "  Get Solution: $($usage.usage.getSolution.used)/$($usage.usage.getSolution.limit)"
        Write-Host "  Plan: $($usage.plan), Role: $($usage.role)"
    } else {
        Write-Host "✗ Usage API returned error: $($usage.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Usage API failed: $_" -ForegroundColor Red
    Write-Host "  This might be due to MongoDB connection issues" -ForegroundColor Yellow
}

# Test 4: Ollama Direct Test
Write-Host ""
Write-Host "[4/4] Testing Ollama directly..." -ForegroundColor Yellow
try {
    $ollama = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Ollama is accessible" -ForegroundColor Green
    Write-Host "  Installed models:" -ForegroundColor Cyan
    foreach ($model in $ollama.models) {
        $sizeMB = [math]::Round($model.size / 1MB, 0)
        Write-Host "    - $($model.name) ($sizeMB MB)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Ollama is not accessible: $_" -ForegroundColor Red
    Write-Host "  Make sure Ollama is running: ollama serve" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""

# Final recommendations
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "2. Try generating a solution for 'Two Sum' in Python" -ForegroundColor White
Write-Host "3. Check browser console (F12) for any errors" -ForegroundColor White
Write-Host "4. Monitor terminal output where vercel dev is running" -ForegroundColor White
Write-Host ""
Write-Host "For detailed fixes, see FIXES_SUMMARY.md" -ForegroundColor Gray
Write-Host ""
