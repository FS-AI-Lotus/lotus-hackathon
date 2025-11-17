# Running Alloy on Windows Without Docker

If Docker is not installed, you can run Alloy directly on Windows.

## Option 1: Install Docker Desktop (Recommended)

**Why Docker is better:**
- No manual installation needed
- Works consistently across systems
- Easier to manage

**Install Docker Desktop:**
1. Download: https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop for Windows
3. Start Docker Desktop
4. Wait for it to fully start (whale icon in system tray)
5. Then run: `docker compose -f docker-compose.monitoring.yml up -d alloy`

## Option 2: Run Alloy Directly (No Docker)

### Step 1: Download Alloy

1. Go to: https://github.com/grafana/alloy/releases
2. Find the latest release
3. Download: `alloy-windows-amd64.exe` (or `alloy-windows-arm64.exe` for ARM)
4. Save it to your project folder: `C:\Users\lelya\Desktop\lotus-hackathon\alloy.exe`

### Step 2: Set Environment Variables

**In CMD:**
```cmd
set COORDINATOR_HOST=localhost:3000
set ENVIRONMENT=development
```

**In PowerShell:**
```powershell
$env:COORDINATOR_HOST="localhost:3000"
$env:ENVIRONMENT="development"
```

### Step 3: Run Alloy

**In CMD:**
```cmd
alloy.exe run --server.http.listen-addr=0.0.0.0:12345 infra\monitoring\alloy.config
```

**In PowerShell:**
```powershell
.\alloy.exe run --server.http.listen-addr=0.0.0.0:12345 infra/monitoring/alloy.config
```

### Step 4: Verify

1. **Check Alloy UI:** http://localhost:12345
2. **Check logs:** Look at the terminal output
3. **Verify metrics:** Check Grafana Cloud for incoming metrics

## Troubleshooting

### "alloy.exe is not recognized"

**Solution:** Make sure you're in the project directory:
```cmd
cd C:\Users\lelya\Desktop\lotus-hackathon
alloy.exe run --server.http.listen-addr=0.0.0.0:12345 infra\monitoring\alloy.config
```

### "Cannot find config file"

**Solution:** Use the correct path format:
- **CMD:** `infra\monitoring\alloy.config` (backslashes)
- **PowerShell:** `infra/monitoring/alloy.config` (forward slashes)

### Alloy can't connect to Coordinator

**Make sure:**
1. Test server is running: `npm start` (in another terminal)
2. Coordinator is accessible: `curl http://localhost:3000/health`
3. Environment variable is set: `echo %COORDINATOR_HOST%` (CMD) or `$env:COORDINATOR_HOST` (PowerShell)

## Quick Start Script

Create `start-alloy.cmd`:

```cmd
@echo off
echo Starting Alloy for Grafana Cloud...
set COORDINATOR_HOST=localhost:3000
set ENVIRONMENT=development
alloy.exe run --server.http.listen-addr=0.0.0.0:12345 infra\monitoring\alloy.config
pause
```

Then just double-click `start-alloy.cmd` to run!

## Alternative: Use Prometheus Remote Write Instead

If you don't want to use Alloy, you can configure Prometheus to remote write directly to Grafana Cloud.

**Update `infra/monitoring/prometheus.yml`:**

Add this section (uncomment and update the remote_write section):

```yaml
remote_write:
  - url: 'https://prometheus-prod-53-prod-me-central-1.grafana.net/api/prom/push'
    basic_auth:
      username: '2805139'
      password: '${GRAFANA_CLOUD_TOKEN}'  # Replace with your actual Grafana Cloud token
```

Then restart Prometheus (if using Docker):
```cmd
docker compose -f docker-compose.monitoring.yml restart prometheus
```

This way you don't need Alloy at all - Prometheus will forward metrics directly to Grafana Cloud!

