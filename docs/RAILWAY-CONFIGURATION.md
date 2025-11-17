# 🚂 Railway Production Configuration Guide

## Current Configuration

Your Railway production URL is configured as:
- **URL**: `https://ms8-learning-analytics-production.up.railway.app`
- **Port**: `443` (HTTPS)
- **Metrics Endpoint**: `https://ms8-learning-analytics-production.up.railway.app/metrics`

## 📋 Quick Configuration

### Step 1: Verify Your Railway URL

Your current Railway URL is set in:
- `infra/monitoring/prometheus.yml` (line 46)
- `RAILWAY-URL.config` (reference file)

### Step 2: Update Prometheus Configuration

The Prometheus configuration is already set for your Railway URL:
- **File**: `infra/monitoring/prometheus.yml`
- **Target**: `ms8-learning-analytics-production.up.railway.app:443`
- **Scheme**: `https`
- **Metrics Path**: `/metrics`

### Step 3: Verify Metrics Endpoint

Make sure your Railway app exposes the `/metrics` endpoint:

```bash
# Test the metrics endpoint
curl https://ms8-learning-analytics-production.up.railway.app/metrics
```

You should see Prometheus-formatted metrics output.

## 🔄 Changing the Railway URL in the Future

### Option 1: Update Files Directly

1. **Update `RAILWAY-URL.config`**:
   ```bash
   RAILWAY_URL=your-new-app.railway.app
   RAILWAY_PORT=443
   ```

2. **Update `infra/monitoring/prometheus.yml`** (around line 46):
   ```yaml
   scrape_configs:
     - job_name: 'coordinator'
       static_configs:
         - targets:
             - 'your-new-app.railway.app:443'  # Update this line
   ```

### Option 2: Use Environment Variables (Advanced)

If you're using Docker Compose, you can set:
```bash
export COORDINATOR_HOST="your-new-app.railway.app:443"
```

Then update `prometheus.yml` to use the environment variable (requires a script to substitute).

## 🎯 Switching Between Local and Production

### For Local Development

In `infra/monitoring/prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'coordinator'
    scheme: 'http'  # Change to http for localhost
    static_configs:
      - targets:
          - 'localhost:3000'  # Use localhost
        labels:
          environment: 'development'  # Change label
```

### For Railway Production

In `infra/monitoring/prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'coordinator'
    scheme: 'https'  # Use https for Railway
    static_configs:
      - targets:
          - 'ms8-learning-analytics-production.up.railway.app:443'  # Railway URL
        labels:
          environment: 'production'  # Production label
```

## ✅ Verification Checklist

Before deploying to Railway:

- [ ] Railway app is deployed and running
- [ ] `/metrics` endpoint is accessible: `curl https://ms8-learning-analytics-production.up.railway.app/metrics`
- [ ] Prometheus config has correct Railway URL
- [ ] Prometheus config uses `scheme: https`
- [ ] Environment label is set to `production`

## 🐛 Troubleshooting

### Prometheus Can't Scrape Railway

**Problem**: Target shows as DOWN in Prometheus

**Solutions**:
1. **Check Railway app is running**: Visit `https://ms8-learning-analytics-production.up.railway.app/health`
2. **Verify metrics endpoint**: `curl https://ms8-learning-analytics-production.up.railway.app/metrics`
3. **Check TLS config**: Railway uses valid SSL certs, but if issues occur, verify `tls_config` in prometheus.yml
4. **Check firewall**: Railway should allow external connections, but verify if using private networking

### Metrics Not Appearing

**Problem**: Prometheus scrapes but no metrics appear

**Solutions**:
1. **Check metrics format**: Should be Prometheus format (not JSON)
2. **Verify endpoint**: Make sure `/metrics` returns data
3. **Check time range**: In Grafana, try "Last 5 minutes"
4. **Check labels**: Verify `service="coordinator"` label matches your queries

## 📚 Related Files

- `infra/monitoring/prometheus.yml` - Main Prometheus configuration
- `RAILWAY-URL.config` - Reference file with Railway URL
- `docs/GRAFANA-QUICK-START.md` - How to view Grafana dashboards

---

**Your Railway URL is configured! Just make sure your app exposes `/metrics` endpoint. 🚂**

