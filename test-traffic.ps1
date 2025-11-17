# Test Traffic Generator for Team 4 Monitoring (PowerShell)
# Generates various types of requests to test metrics collection

Write-Host "🚀 Generating test traffic for monitoring verification..." -ForegroundColor Cyan
Write-Host ""

# Health checks
Write-Host "1️⃣  Health checks (20 requests)..." -ForegroundColor Yellow
1..20 | ForEach-Object { 
    Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing | Out-Null
    Start-Sleep -Milliseconds 100
}
Write-Host "   ✅ Health checks completed" -ForegroundColor Green

# Service registrations
Write-Host ""
Write-Host "2️⃣  Service registrations (5 success, 2 failures)..." -ForegroundColor Yellow
1..5 | ForEach-Object {
    $body = @{
        name = "service-$_"
        url = "http://localhost:$((3000 + $_))"
    } | ConvertTo-Json
    
    Invoke-WebRequest -Uri "http://localhost:3000/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing | Out-Null
    Start-Sleep -Milliseconds 200
}

# Failed registrations
Invoke-WebRequest -Uri "http://localhost:3000/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"name":""}' `
    -UseBasicParsing | Out-Null

Invoke-WebRequest -Uri "http://localhost:3000/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"name":"invalid","url":"not-a-url"}' `
    -UseBasicParsing | Out-Null

Write-Host "   ✅ Service registrations completed" -ForegroundColor Green

# Routing operations
Write-Host ""
Write-Host "3️⃣  Routing operations (10 success, 3 failures)..." -ForegroundColor Yellow
1..10 | ForEach-Object {
    $body = @{
        origin = "client-$_"
        destination = "service-1"
        data = @{ key = "value-$_" }
    } | ConvertTo-Json
    
    Invoke-WebRequest -Uri "http://localhost:3000/route" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing | Out-Null
    Start-Sleep -Milliseconds 150
}

# Failed routing (non-existent destination)
1..3 | ForEach-Object {
    $body = @{
        origin = "client"
        destination = "nonexistent-$_"
        data = @{ key = "value" }
    } | ConvertTo-Json
    
    Invoke-WebRequest -Uri "http://localhost:3000/route" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing | Out-Null
    Start-Sleep -Milliseconds 150
}

Write-Host "   ✅ Routing operations completed" -ForegroundColor Green

# Error requests
Write-Host ""
Write-Host "4️⃣  Error requests (5 requests)..." -ForegroundColor Yellow
1..5 | ForEach-Object { 
    Invoke-WebRequest -Uri "http://localhost:3000/error" -UseBasicParsing | Out-Null
    Start-Sleep -Milliseconds 200
}
Write-Host "   ✅ Error requests completed" -ForegroundColor Green

# Mixed traffic
Write-Host ""
Write-Host "5️⃣  Mixed traffic (30 requests)..." -ForegroundColor Yellow
1..30 | ForEach-Object {
    $endpoint = switch ($_ % 4) {
        0 { "health" }
        1 { "test" }
        2 { "services" }
        3 { "metrics" }
    }
    Invoke-WebRequest -Uri "http://localhost:3000/$endpoint" -UseBasicParsing | Out-Null
    Start-Sleep -Milliseconds 100
}
Write-Host "   ✅ Mixed traffic completed" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Test traffic generation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Check Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "   2. Check Grafana: http://localhost:3001" -ForegroundColor White
Write-Host "   3. Verify all dashboard panels show data" -ForegroundColor White
Write-Host ""

