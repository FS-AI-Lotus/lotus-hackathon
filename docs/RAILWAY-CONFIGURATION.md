# 🚂 Railway Production Configuration Guide

## Current Configuration

**Note**: The Prometheus configuration uses a generic placeholder. You need to set your production URL.

To configure your Railway production URL:
1. Update `infra/monitoring/prometheus.yml` (line 46) with your Railway URL
2. Update `RAILWAY-URL.config` with your Railway URL

**Example Railway URL format:**
- **URL**: `https://your-app.railway.app`
- **Port**: `443` (HTTPS)
- **Metrics Endpoint**: `https://your-app.railway.app/metrics`

## 📋 Quick Configuration

### Step 1: Configure Your Production URL

Update the Prometheus configuration with your Railway URL:

1. **Update `infra/monitoring/prometheus.yml`** (line 46):
   ```yaml
   static_configs:
     - targets:
         - 'your-app.railway.app:443'  # Replace with your Railway URL
   ```

2. **Update `RAILWAY-URL.config`** (optional, for reference):
   ```
   PRODUCTION_URL=your-app.railway.app
   PRODUCTION_PORT=443
   ```

### Step 2: Verify Prometheus Configuration

The Prometheus configuration should have:
- **File**: `infra/monitoring/prometheus.yml`
- **Target**: `your-app.railway.app:443` (your Railway URL)
- **Scheme**: `https`
- **Metrics Path**: `/metrics`

### Step 3: Verify Metrics Endpoint

Make sure your Railway app exposes the `/metrics` endpoint:

```bash
# Test the metrics endpoint (replace with your URL)
curl https://your-app.railway.app/metrics
```

You should see Prometheus-formatted metrics output.

## 🔄 Changing the Railway URL in the Future

### Option 1: Update Files Directly

1. **Update `RAILWAY-URL.config`** (optional, for reference):
   ```
   PRODUCTION_URL=your-new-app.railway.app
   PRODUCTION_PORT=443
   ```

2. **Update `infra/monitoring/prometheus.yml`** (around line 46):
   ```yaml
   scrape_configs:
     - job_name: 'coordinator'
       static_configs:
         - targets:
             - 'your-new-app.railway.app:443'  # Update this line with your URL
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
          - 'your-app.railway.app:443'  # Replace with your Railway URL
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
1. **Check Railway app is running**: Visit `https://your-app.railway.app/health` (replace with your URL)
2. **Verify metrics endpoint**: `curl https://your-app.railway.app/metrics` (replace with your URL)
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

