# Team 4 Monitoring Setup Script (PowerShell)
# This script helps you set up and manage the monitoring stack on Windows

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "check", "targets", "logs", "clean")]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ComposeFile = Join-Path $ProjectRoot "docker-compose.monitoring.yml"

function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Test-Dependencies {
    Write-Info "Checking dependencies..."
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    }
    Write-Success "Docker is installed"
    
    # Check for docker compose (modern) or docker-compose (legacy)
    $hasDockerCompose = $false
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        if (docker compose version 2>$null) {
            $hasDockerCompose = $true
            $script:DockerComposeCmd = "docker compose"
        } elseif (Get-Command docker-compose -ErrorAction SilentlyContinue) {
            $hasDockerCompose = $true
            $script:DockerComposeCmd = "docker-compose"
        }
    }
    
    if (-not $hasDockerCompose) {
        Write-Error "Docker Compose is not installed. Please install Docker Desktop."
        exit 1
    }
    Write-Success "Docker Compose is installed (using: $script:DockerComposeCmd)"
}

function Start-Monitoring {
    Write-Header "Starting Team 4 Monitoring Stack"
    
    Push-Location $ProjectRoot
    
    if (-not $env:COORDINATOR_HOST) {
        $env:COORDINATOR_HOST = "host.docker.internal:3000"
        Write-Info "Using default COORDINATOR_HOST: $env:COORDINATOR_HOST"
        Write-Info "Set COORDINATOR_HOST environment variable to change this"
    }
    
    # Determine which docker compose command to use
    if (-not $script:DockerComposeCmd) {
        if (docker compose version 2>$null) {
            $script:DockerComposeCmd = "docker compose"
        } else {
            $script:DockerComposeCmd = "docker-compose"
        }
    }
    
    Write-Info "Starting Prometheus and Grafana..."
    if ($script:DockerComposeCmd -eq "docker compose") {
        docker compose -f $ComposeFile up -d
    } else {
        docker-compose -f $ComposeFile up -d
    }
    
    Write-Success "Monitoring stack started!"
    Write-Host ""
    Write-Info "Services:"
    Write-Host "  📊 Prometheus: http://localhost:9090"
    Write-Host "  📈 Grafana:    http://localhost:3001 (admin/admin)"
    Write-Host ""
    Write-Info "Waiting for services to be ready..."
    Start-Sleep -Seconds 5
    
    Test-Services
    Pop-Location
}

function Stop-Monitoring {
    Write-Header "Stopping Team 4 Monitoring Stack"
    
    Push-Location $ProjectRoot
    
    # Determine which docker compose command to use
    if (-not $script:DockerComposeCmd) {
        if (docker compose version 2>$null) {
            $script:DockerComposeCmd = "docker compose"
        } else {
            $script:DockerComposeCmd = "docker-compose"
        }
    }
    
    if ($script:DockerComposeCmd -eq "docker compose") {
        docker compose -f $ComposeFile down
    } else {
        docker-compose -f $ComposeFile down
    }
    Write-Success "Monitoring stack stopped!"
    Pop-Location
}

function Restart-Monitoring {
    Write-Header "Restarting Team 4 Monitoring Stack"
    Stop-Monitoring
    Start-Sleep -Seconds 2
    Start-Monitoring
}

function Test-Services {
    Write-Info "Checking service health..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9090/-/healthy" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Success "Prometheus is running (http://localhost:9090)"
    } catch {
        Write-Error "Prometheus is not responding"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Success "Grafana is running (http://localhost:3001)"
    } catch {
        Write-Warning "Grafana may still be starting up..."
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Success "Coordinator/test server is reachable"
    } catch {
        Write-Warning "Coordinator/test server is not running on port 3000"
        Write-Info "Start test server with: node test-server.js"
    }
}

function Show-Status {
    Write-Header "Team 4 Monitoring Stack Status"
    
    Push-Location $ProjectRoot
    
    # Determine which docker compose command to use
    if (-not $script:DockerComposeCmd) {
        if (docker compose version 2>$null) {
            $script:DockerComposeCmd = "docker compose"
        } else {
            $script:DockerComposeCmd = "docker-compose"
        }
    }
    
    if ($script:DockerComposeCmd -eq "docker compose") {
        docker compose -f $ComposeFile ps
    } else {
        docker-compose -f $ComposeFile ps
    }
    Write-Host ""
    Test-Services
    Pop-Location
}

function Show-Targets {
    Write-Header "Checking Prometheus Targets"
    Write-Info "Opening Prometheus targets page..."
    Write-Info "Check: http://localhost:9090/targets"
    Start-Process "http://localhost:9090/targets"
}

function View-Logs {
    Write-Header "Monitoring Stack Logs"
    Push-Location $ProjectRoot
    
    # Determine which docker compose command to use
    if (-not $script:DockerComposeCmd) {
        if (docker compose version 2>$null) {
            $script:DockerComposeCmd = "docker compose"
        } else {
            $script:DockerComposeCmd = "docker-compose"
        }
    }
    
    if ($script:DockerComposeCmd -eq "docker compose") {
        docker compose -f $ComposeFile logs -f
    } else {
        docker-compose -f $ComposeFile logs -f
    }
    Pop-Location
}

function Clean-Data {
    Write-Header "Cleaning Monitoring Data"
    
    $response = Read-Host "This will delete all Prometheus and Grafana data. Continue? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Push-Location $ProjectRoot
        
        # Determine which docker compose command to use
        if (-not $script:DockerComposeCmd) {
            if (docker compose version 2>$null) {
                $script:DockerComposeCmd = "docker compose"
            } else {
                $script:DockerComposeCmd = "docker-compose"
            }
        }
        
        if ($script:DockerComposeCmd -eq "docker compose") {
            docker compose -f $ComposeFile down -v
        } else {
            docker-compose -f $ComposeFile down -v
        }
        Write-Success "All monitoring data cleaned!"
        Pop-Location
    } else {
        Write-Info "Cancelled"
    }
}

# Main script
switch ($Command) {
    "start" {
        Test-Dependencies
        Start-Monitoring
    }
    "stop" {
        Stop-Monitoring
    }
    "restart" {
        Test-Dependencies
        Restart-Monitoring
    }
    "status" {
        Show-Status
    }
    "check" {
        Test-Services
    }
    "targets" {
        Show-Targets
    }
    "logs" {
        View-Logs
    }
    "clean" {
        Clean-Data
    }
    default {
        Write-Host "Team 4 Monitoring Setup Script" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Usage: .\scripts\monitoring-setup.ps1 {start|stop|restart|status|check|targets|logs|clean}"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  start    - Start Prometheus and Grafana"
        Write-Host "  stop     - Stop Prometheus and Grafana"
        Write-Host "  restart  - Restart the monitoring stack"
        Write-Host "  status   - Show status of all services"
        Write-Host "  check    - Check if services are healthy"
        Write-Host "  targets  - Check Prometheus targets"
        Write-Host "  logs     - View logs from all services"
        Write-Host "  clean    - Remove all data (Prometheus + Grafana)"
        Write-Host ""
        Write-Host "Environment Variables:"
        Write-Host "  COORDINATOR_HOST - Coordinator host:port (default: host.docker.internal:3000)"
    }
}

