# Prometheus Remote Write to Grafana Cloud - Setup Guide

This guide shows you how to configure Prometheus to send metrics directly to Grafana Cloud using remote write (Option 3 - No Alloy needed).

## ✅ Configuration Complete

The `prometheus.yml` file is already configured with remote write to Grafana Cloud. The configuration is **active** (uncommented).

## 🚀 How to Use

### Step 1: Start Prometheus

**Using Docker Compose (Recommended):**

```powershell
# Start Prometheus (and Grafana)
docker compose -f docker-compose.monitoring.yml up -d prometheus

# Or start everything including Grafana
docker compose -f docker-compose.monitoring.yml up -d
```

**Note:** If Docker is not installed, you'll need to:
1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Or use the npm scripts: `npm run monitoring:start`

### Step 2: Verify Remote Write is Working

1. **Check Prometheus logs:**
   ```powershell
   docker compose -f docker-compose.monitoring.yml logs prometheus | Select-String "remote_write"
   ```

2. **Check Prometheus UI:**
   - Open: http://localhost:9090
   - Go to: **Status → Runtime & Build Information**
   - Look for remote write configuration

3. **Check Prometheus Targets:**
   - Go to: http://localhost:9090/targets
   - Coordinator should show as `UP`

### Step 3: Verify Metrics in Grafana Cloud

1. **Log into Grafana Cloud:**
   - Go to: https://grafana.com/auth/sign-in/
   - Log in with your account

2. **Navigate to Prometheus:**
   - Go to your Grafana Cloud instance
   - Open **Explore** or create a dashboard
   - Select the Prometheus data source

3. **Query metrics:**
   ```promql
   # Check if metrics are arriving
   up{job="coordinator"}
   
   # View request metrics
   http_requests_total{service="coordinator"}
   
   # View latency
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{service="coordinator"}[5m]))
   ```

## 🔧 Configuration Details

The remote write configuration in `prometheus.yml`:

```yaml
remote_write:
  - url: 'https://prometheus-prod-XX-prod-YY-ZZ.grafana.net/api/prom/push'
    basic_auth:
      username: '${GRAFANA_CLOUD_USERNAME}'
      password: 'YOUR_GRAFANA_CLOUD_TOKEN_HERE'
    queue_config:
      max_samples_per_send: 1000
      max_shards: 200
      capacity: 2500
```

## 🔄 Restart Prometheus After Changes

If you modify `prometheus.yml`, restart Prometheus:

**Docker Compose:**
```powershell
# Restart Prometheus to apply new config
docker compose -f docker-compose.monitoring.yml restart prometheus

# Or use the npm script
npm run monitoring:stop
npm run monitoring:start
```

**Or reload configuration (if enabled):**
```powershell
# Send SIGHUP to reload config without restart
docker compose -f docker-compose.monitoring.yml exec prometheus kill -HUP 1
```

**Check if Prometheus is running:**
```powershell
# Check status
docker compose -f docker-compose.monitoring.yml ps prometheus

# Or use npm script
npm run monitoring:status
```

## ✅ Verification Checklist

- [ ] Prometheus is running
- [ ] Remote write is configured in `prometheus.yml` (uncommented)
- [ ] Prometheus can scrape Coordinator (`/targets` shows UP)
- [ ] Prometheus logs show no remote write errors
- [ ] Metrics appear in Grafana Cloud (query `up{job="coordinator"}`)

## 🐛 Troubleshooting

### Remote Write Failing

**Check Prometheus logs:**
```powershell
docker compose -f docker-compose.monitoring.yml logs prometheus
```

**Common issues:**
1. **Authentication error**: Check username/password are correct
2. **Network error**: Check internet connectivity to Grafana Cloud
3. **URL error**: Verify the remote write URL is correct

### Metrics Not Appearing in Grafana Cloud

1. **Wait a few minutes**: Metrics may take 1-2 minutes to appear
2. **Check Prometheus is scraping**: Verify targets are UP
3. **Check labels**: Ensure metrics have correct labels (`service="coordinator"`)
4. **Verify data source**: Make sure Grafana Cloud Prometheus data source is configured

### Test Remote Write Connection

**Using curl:**
```powershell
$token = "YOUR_GRAFANA_CLOUD_TOKEN_HERE"
$username = "${GRAFANA_CLOUD_USERNAME}"
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${username}:${token}"))

Invoke-WebRequest -Uri "https://prometheus-prod-XX-prod-YY-ZZ.grafana.net/api/prom/push" `
  -Method POST `
  -Headers @{Authorization="Basic $base64Auth"} `
  -ContentType "application/x-protobuf" `
  -Body $null
```

## 🔒 Security Notes

⚠️ **Important**: The Grafana Cloud token is currently in the config file.

**For production:**
- Use environment variables or secrets management
- Don't commit tokens to public repositories
- Rotate tokens regularly

**To use environment variable (requires config preprocessing):**
1. Create a script to substitute env vars in `prometheus.yml`
2. Or use a tool like `envsubst` or `gomplate`
3. Or use Docker secrets/Kubernetes secrets

## 📊 What Gets Sent

All metrics scraped by Prometheus are forwarded to Grafana Cloud:
- `http_requests_total` - Request counters
- `http_request_duration_seconds` - Latency histograms
- `http_errors_total` - Error counters
- `coordinator_service_registrations_total` - Registration metrics
- `coordinator_routing_operations_total` - Routing metrics
- `process_start_time_seconds` - Uptime
- All default Prometheus metrics (CPU, memory, etc.)

## 🎯 Next Steps

1. **Start Prometheus** (if not already running)
2. **Generate some traffic** to the test server: `npm start` and run `.\test-traffic.ps1`
3. **Check Grafana Cloud** - metrics should appear within 1-2 minutes
4. **Create dashboards** in Grafana Cloud using the forwarded metrics

---

**That's it! Prometheus will now automatically forward all metrics to Grafana Cloud.** 🎉

