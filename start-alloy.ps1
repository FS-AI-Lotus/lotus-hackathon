# PowerShell script to start Alloy for Grafana Cloud

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Alloy for Grafana Cloud" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if alloy.exe exists
if (-not (Test-Path "alloy.exe")) {
    Write-Host "ERROR: alloy.exe not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download Alloy from:" -ForegroundColor Yellow
    Write-Host "https://github.com/grafana/alloy/releases" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Download: alloy-windows-amd64.exe" -ForegroundColor Yellow
    Write-Host "Rename to: alloy.exe" -ForegroundColor Yellow
    Write-Host "Place in: $PWD" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Set environment variables
$env:COORDINATOR_HOST = "localhost:3000"
$env:ENVIRONMENT = "development"

Write-Host "Environment variables set:" -ForegroundColor Green
Write-Host "  COORDINATOR_HOST=$env:COORDINATOR_HOST"
Write-Host "  ENVIRONMENT=$env:ENVIRONMENT"
Write-Host ""

# Check if test server is running
Write-Host "Checking if test server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Test server is running" -ForegroundColor Green
} catch {
    Write-Host "⚠ WARNING: Test server may not be running on port 3000" -ForegroundColor Yellow
    Write-Host "  Start it with: npm start" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Starting Alloy..." -ForegroundColor Cyan
Write-Host "Alloy UI will be available at: http://localhost:12345" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run Alloy
& .\alloy.exe run --server.http.listen-addr=0.0.0.0:12345 infra/monitoring/alloy.config

