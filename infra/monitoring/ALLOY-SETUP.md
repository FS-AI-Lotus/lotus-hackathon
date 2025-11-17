# Grafana Alloy Setup Guide

This guide explains how to use Grafana Alloy to scrape metrics from the Coordinator service and forward them to Grafana Cloud.

## What is Alloy?

Grafana Alloy is an open-source observability collector that can:
- Scrape Prometheus metrics
- Forward metrics to Grafana Cloud
- Collect logs, traces, and other observability data

## Configuration File

The Alloy configuration is in `infra/monitoring/alloy.config`. It includes:
- Prometheus scrape configuration for Coordinator service
- Remote write to Grafana Cloud Prometheus

## Setup Instructions

### Option 1: Run Alloy Locally

#### Windows (PowerShell)

1. **Install Alloy:**
   ```powershell
   # Download from: https://github.com/grafana/alloy/releases
   # Download the Windows .exe file and add to PATH
   # Or use Chocolatey: choco install alloy
   ```

2. **Set environment variables:**
   ```powershell
   $env:COORDINATOR_HOST="localhost:3000"
   $env:ENVIRONMENT="development"
   ```

3. **Run Alloy:**
   ```powershell
   alloy run --server.http.listen-addr=0.0.0.0:12345 infra/monitoring/alloy.config
   ```

#### Windows (CMD)

1. **Install Alloy:**
   ```cmd
   REM Download from: https://github.com/grafana/alloy/releases
   REM Download the Windows .exe file and add to PATH
   ```

2. **Set environment variables:**
   ```cmd
   set COORDINATOR_HOST=localhost:3000
   set ENVIRONMENT=development
   ```

3. **Run Alloy:**
   ```cmd
   alloy run --server.http.listen-addr=0.0.0.0:12345 infra/monitoring/alloy.config
   ```

#### Linux/Mac

1. **Install Alloy:**
   ```bash
   # Download from: https://github.com/grafana/alloy/releases
   # Or use package manager
   ```

2. **Set environment variables:**
   ```bash
   export COORDINATOR_HOST="localhost:3000"
   export ENVIRONMENT="development"
   ```

3. **Run Alloy:**
   ```bash
   alloy run --server.http.listen-addr=0.0.0.0:12345 infra/monitoring/alloy.config
   ```

4. **Verify:**
   - Alloy UI: http://localhost:12345
   - Check metrics are being forwarded to Grafana Cloud

### Option 2: Run Alloy with Docker (Recommended for Windows)

This is the **easiest option for Windows** - no need to install Alloy separately!

1. **Uncomment the Alloy service** in `docker-compose.monitoring.yml`:
   - Open `docker-compose.monitoring.yml`
   - Find the commented `alloy:` section (around line 64)
   - Uncomment all lines (remove the `#` at the start of each line)

2. **Start Alloy:**

   **Windows (PowerShell):**
   ```powershell
   docker compose -f docker-compose.monitoring.yml up -d alloy
   ```

   **Windows (CMD):**
   ```cmd
   docker compose -f docker-compose.monitoring.yml up -d alloy
   ```

   **Linux/Mac:**
   ```bash
   docker compose -f docker-compose.monitoring.yml up -d alloy
   ```

3. **Or start all services including Alloy:**
   ```powershell
   # Windows PowerShell
   docker compose -f docker-compose.monitoring.yml up -d
   ```

4. **Verify Alloy is running:**
   ```powershell
   # Check status
   docker compose -f docker-compose.monitoring.yml ps alloy
   
   # Check logs
   docker compose -f docker-compose.monitoring.yml logs alloy
   
   # Check Alloy UI
   # Open: http://localhost:12345
   ```

### Option 3: Use with Existing Prometheus

If you're already running Prometheus, you can configure Prometheus to remote write to Grafana Cloud instead of using Alloy.

**Update `prometheus.yml`:**
```yaml
remote_write:
  - url: 'https://prometheus-prod-53-prod-me-central-1.grafana.net/api/prom/push'
    basic_auth:
      username: '2805139'
      password: '${GRAFANA_CLOUD_TOKEN}'  # Replace with your actual Grafana Cloud token
```

## Verification

1. **Check Alloy is running:**
   ```bash
   curl http://localhost:12345/-/healthy
   ```

2. **View Alloy UI:**
   - Open: http://localhost:12345
   - Check component status
   - View metrics being scraped

3. **Verify in Grafana Cloud:**
   - Log into your Grafana Cloud account
   - Navigate to Prometheus data source
   - Query metrics: `up{job="coordinator"}`

## Environment Variables

- `COORDINATOR_HOST` - Coordinator service host:port (default: `localhost:3000`)
- `ENVIRONMENT` - Environment name (default: `development`)

### Setting Environment Variables

**Windows PowerShell:**
```powershell
$env:COORDINATOR_HOST="localhost:3000"
$env:ENVIRONMENT="development"
```

**Windows CMD:**
```cmd
set COORDINATOR_HOST=localhost:3000
set ENVIRONMENT=development
```

**Linux/Mac:**
```bash
export COORDINATOR_HOST="localhost:3000"
export ENVIRONMENT="development"
```

**For Docker Compose:**
Environment variables are set in `docker-compose.monitoring.yml`:
```yaml
environment:
  - COORDINATOR_HOST=${COORDINATOR_HOST:-host.docker.internal:3000}
  - ENVIRONMENT=${ENVIRONMENT:-development}
```

You can override them when starting:
```powershell
# Windows PowerShell
$env:COORDINATOR_HOST="localhost:3000"
docker compose -f docker-compose.monitoring.yml up -d alloy
```

## Security Notes

⚠️ **Important**: The Alloy config contains Grafana Cloud credentials. 

- **Do NOT commit credentials to public repositories**
- Use environment variables or secrets management for production
- Consider using `.env` file (and add to `.gitignore`)

**Recommended approach:**
```bash
# Use environment variables
export GRAFANA_CLOUD_USERNAME="2805139"
export GRAFANA_CLOUD_PASSWORD="your-token-here"

# Update alloy.config to use env vars:
# username = env("GRAFANA_CLOUD_USERNAME")
# password = env("GRAFANA_CLOUD_PASSWORD")
```

## Troubleshooting

### Alloy can't connect to Coordinator

**Problem**: `connection refused` errors

**Solutions:**
1. Check Coordinator is running: `curl http://localhost:3000/health`
2. Check `COORDINATOR_HOST` environment variable
3. If using Docker, use `host.docker.internal:3000` (Windows/Mac) or host network mode

### Metrics not appearing in Grafana Cloud

**Solutions:**
1. Check Alloy logs for errors
2. Verify credentials are correct
3. Check network connectivity to Grafana Cloud
4. Verify metrics are being scraped: Check Alloy UI at http://localhost:12345

### Alloy component shows error

**Solutions:**
1. Check Alloy UI: http://localhost:12345
2. View component status and error messages
3. Verify configuration syntax is correct
4. Check Alloy logs

## Additional Resources

- [Grafana Alloy Documentation](https://grafana.com/docs/alloy/latest/)
- [Alloy Configuration Reference](https://grafana.com/docs/alloy/latest/reference/config-blocks/)
- [Grafana Cloud Prometheus](https://grafana.com/docs/grafana-cloud/monitor-applications/application-observability/metrics/)

---

**Note**: This configuration is set up for the hackathon. For production, use proper secrets management and environment-specific configurations.

