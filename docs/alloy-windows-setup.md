# Grafana Alloy Windows Setup Guide

This guide explains how to set up Grafana Alloy on Windows to forward metrics and logs to Grafana Cloud.

## ⚠️ Security Warning

**DO NOT commit API keys or tokens to the repository.** The API key in installation commands should be stored as an environment variable or secret management system.

## ⚠️ Security Warning

**IMPORTANT:** The installation command contains an API key. **DO NOT** run this command if you're sharing your screen or if the command will be logged. Instead:

1. Set the API key as an environment variable
2. Use the manual installation steps below
3. Or use the provided configuration file with environment variables

## Installation

### Option 1: Quick Install (One-Line Command)

⚠️ **Warning:** This command contains your API key. Only use this if you're in a secure environment.

```powershell
cd "%TEMP%" && powershell -c Invoke-WebRequest "https://storage.googleapis.com/cloud-onboarding/alloy/scripts/install-windows.ps1" -OutFile "install-windows.ps1" && powershell -executionpolicy Bypass -File ".\install-windows.ps1" -GCLOUD_HOSTED_METRICS_URL "https://prometheus-prod-53-prod-me-central-1.grafana.net/api/prom/push" -GCLOUD_HOSTED_METRICS_ID "YOUR_METRICS_ID_HERE" -GCLOUD_SCRAPE_INTERVAL "60s" -GCLOUD_HOSTED_LOGS_URL "https://logs-prod-033.grafana.net/loki/api/v1/push" -GCLOUD_HOSTED_LOGS_ID "YOUR_LOGS_ID_HERE" -GCLOUD_RW_API_KEY "YOUR_GRAFANA_CLOUD_TOKEN_HERE"
```

**Replace placeholders:**
- `YOUR_METRICS_ID_HERE` - Your Grafana Cloud metrics instance ID (e.g., `2805139`)
- `YOUR_LOGS_ID_HERE` - Your Grafana Cloud logs instance ID (e.g., `1398247`)
- `YOUR_GRAFANA_CLOUD_TOKEN_HERE` - Your Grafana Cloud API token

### Option 2: Manual Installation with Environment Variables (Recommended)

1. **Set environment variables (secure method):**
   ```powershell
   $env:GCLOUD_HOSTED_METRICS_URL = "https://prometheus-prod-53-prod-me-central-1.grafana.net/api/prom/push"
   $env:GCLOUD_HOSTED_METRICS_ID = "YOUR_METRICS_ID_HERE"
   $env:GCLOUD_SCRAPE_INTERVAL = "60s"
   $env:GCLOUD_HOSTED_LOGS_URL = "https://logs-prod-033.grafana.net/loki/api/v1/push"
   $env:GCLOUD_HOSTED_LOGS_ID = "YOUR_LOGS_ID_HERE"
   $env:GCLOUD_RW_API_KEY = "YOUR_GRAFANA_CLOUD_TOKEN_HERE"
   ```

2. **Download the installer:**
   ```powershell
   cd $env:TEMP
   Invoke-WebRequest "https://storage.googleapis.com/cloud-onboarding/alloy/scripts/install-windows.ps1" -OutFile "install-windows.ps1"
   ```

3. **Run the installer:**
   ```powershell
   powershell -executionpolicy Bypass -File ".\install-windows.ps1" `
     -GCLOUD_HOSTED_METRICS_URL $env:GCLOUD_HOSTED_METRICS_URL `
     -GCLOUD_HOSTED_METRICS_ID $env:GCLOUD_HOSTED_METRICS_ID `
     -GCLOUD_SCRAPE_INTERVAL $env:GCLOUD_SCRAPE_INTERVAL `
     -GCLOUD_HOSTED_LOGS_URL $env:GCLOUD_HOSTED_LOGS_URL `
     -GCLOUD_HOSTED_LOGS_ID $env:GCLOUD_HOSTED_LOGS_ID `
     -GCLOUD_RW_API_KEY $env:GCLOUD_RW_API_KEY
   ```

### Option 3: Use Custom Configuration File

1. **Install Alloy** (without full configuration):
   ```powershell
   cd $env:TEMP
   Invoke-WebRequest "https://storage.googleapis.com/cloud-onboarding/alloy/scripts/install-windows.ps1" -OutFile "install-windows.ps1"
   powershell -executionpolicy Bypass -File ".\install-windows.ps1"
   ```

2. **Copy the configuration file:**
   ```powershell
   Copy-Item "infra\monitoring\alloy-windows.config" "C:\Program Files\Grafana Alloy\config.alloy"
   ```

3. **Set environment variables** (see Option 2 above)

4. **Restart Alloy service:**
   ```powershell
   sc stop "Alloy"
   sc start "Alloy"
   ```

## Alloy Configuration

After installation, Alloy will be configured with Windows exporter and Windows Event Logs collection. The configuration includes:

### Windows Exporter Metrics

- **Collectors enabled:** cpu, cs, logical_disk, net, os, service, system, time, diskdrive
- **Job name:** `integrations/windows_exporter`
- **Metrics filtered:** Only essential Windows metrics are kept (CPU, memory, disk, network, system)

### Windows Event Logs

- **Application Log:** Forwarded to Grafana Cloud Loki
- **System Log:** Forwarded to Grafana Cloud Loki
- **Labels:** Includes `instance` (hostname) and `job` (integrations/windows_exporter)

## Service Management

### Check Alloy Status

```powershell
sc query "Alloy" | find "STATE"
```

### Restart Alloy Service

```powershell
sc stop "Alloy"
sc start "Alloy"
```

### View Alloy Logs

Alloy logs are typically located at:
- `C:\Program Files\Grafana Alloy\alloy.log`
- Windows Event Viewer: Applications and Services Logs > Grafana Alloy

## Configuration File Location

The Alloy configuration file is typically located at:
- `C:\Program Files\Grafana Alloy\config.alloy`

You can edit this file to customize the configuration. After editing, restart the Alloy service.

## Configuration Files

### `alloy-windows.config`

Complete Windows configuration file at `infra/monitoring/alloy-windows.config` includes:

- ✅ Windows exporter metrics collection (CPU, disk, network, system)
- ✅ Windows Event Logs (Application and System)
- ✅ Prometheus remote write to Grafana Cloud
- ✅ Loki remote write to Grafana Cloud
- ✅ Metric filtering and relabeling
- ✅ Coordinator service scraping (commented, ready to enable)

### `alloy.config`

Basic Coordinator-only configuration at `infra/monitoring/alloy.config` for Linux/Docker environments.

## Verification

### Check if Metrics are Reaching Grafana Cloud

1. Log into Grafana Cloud
2. Navigate to Explore
3. Select your Prometheus data source
4. Query: `up{job="integrations/windows_exporter"}`

### Check if Logs are Reaching Grafana Cloud

1. Log into Grafana Cloud
2. Navigate to Explore
3. Select your Loki data source
4. Query: `{job="integrations/windows_exporter"}`

## Troubleshooting

### Alloy Service Won't Start

1. Check Windows Event Viewer for errors
2. Verify the configuration file syntax: `alloy validate config.alloy`
3. Check file permissions on the Alloy directory
4. Ensure ports are not blocked by firewall

### Metrics Not Appearing in Grafana Cloud

1. Verify API key is correct
2. Check network connectivity to Grafana Cloud endpoints
3. Review Alloy logs for errors
4. Verify the scrape interval is appropriate

### Logs Not Appearing in Grafana Cloud

1. Verify logs API key and endpoint are correct
2. Check Windows Event Log permissions
3. Review Alloy logs for Loki-related errors
4. Verify bookmark files are writable

## Security Best Practices

1. **Never commit API keys** - Use environment variables or secret management
2. **Restrict file permissions** - Limit access to Alloy configuration files
3. **Use service accounts** - Run Alloy with minimal required permissions
4. **Monitor access** - Review Grafana Cloud access logs regularly
5. **Rotate keys** - Regularly rotate API keys

## Integration with Coordinator Service

To forward Coordinator service metrics through Alloy:

1. Ensure Coordinator `/metrics` endpoint is accessible
2. Add a scrape configuration in Alloy:
   ```alloy
   prometheus.scrape "coordinator" {
     targets    = [{"__address__" = "localhost:3000"}]
     forward_to = [prometheus.remote_write.metrics_service.receiver]
     job_name   = "coordinator"
   }
   ```

3. Restart Alloy service

## Additional Resources

- [Grafana Alloy Documentation](https://grafana.com/docs/alloy/latest/)
- [Windows Exporter Documentation](https://github.com/prometheus-community/windows_exporter)
- [Grafana Cloud Documentation](https://grafana.com/docs/grafana-cloud/)

