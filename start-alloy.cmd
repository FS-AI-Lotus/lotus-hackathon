@echo off
echo ========================================
echo Starting Alloy for Grafana Cloud
echo ========================================
echo.

REM Check if alloy.exe exists
if not exist "alloy.exe" (
    echo ERROR: alloy.exe not found!
    echo.
    echo Please download Alloy from:
    echo https://github.com/grafana/alloy/releases
    echo.
    echo Download: alloy-windows-amd64.exe
    echo Rename to: alloy.exe
    echo Place in: %CD%
    echo.
    pause
    exit /b 1
)

REM Set environment variables
set COORDINATOR_HOST=localhost:3000
set ENVIRONMENT=development

echo Environment variables set:
echo   COORDINATOR_HOST=%COORDINATOR_HOST%
echo   ENVIRONMENT=%ENVIRONMENT%
echo.

REM Check if test server is running
echo Checking if test server is running...
curl -s http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    echo WARNING: Test server may not be running on port 3000
    echo Start it with: npm start
    echo.
)

echo Starting Alloy...
echo Alloy UI will be available at: http://localhost:12345
echo Press Ctrl+C to stop
echo.
echo ========================================
echo.

alloy.exe run --server.http.listen-addr=0.0.0.0:12345 infra\monitoring\alloy.config

pause

