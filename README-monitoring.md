# 📊 Team 4 Monitoring Setup

## 🎯 Overview

This monitoring setup uses **localhost for local development** and can be easily configured for **Railway production deployment**.

**Key Files:**
- `infra/monitoring/prometheus.yml` - Prometheus configuration (update target URL for Railway)
- `infra/monitoring/alerts.yml` - Alert rules
- `infra/monitoring/grafana-dashboard-coordinator.json` - Grafana dashboard
- `infra/monitoring/grafana-datasource.yml` - Grafana data source config

## 🚀 Local Development Setup

### Option 1: Run Prometheus & Grafana Locally (Recommended)

1. **Install Prometheus & Grafana** on your machine
2. **Update `prometheus.yml`** - target is already set to `localhost:3000`
3. **Start your Coordinator service** on port 3000
4. **Start Prometheus**: `prometheus --config.file=./infra/monitoring/prometheus.yml`
5. **Start Grafana** and import the dashboard

### Option 2: Use Docker (Optional)

If you prefer Docker for local development:

```bash
npm run monitoring:docker:start
```

This uses `docker-compose.monitoring.yml` (optional setup).

## 🚂 Railway Production Setup

### Current Configuration

Your Railway URL is already configured:
- **URL**: `ms8-learning-analytics-production.up.railway.app:443`
- **File**: `infra/monitoring/prometheus.yml`

### To Change Railway URL in the Future

1. **Update `RAILWAY-URL.config`** with your new URL
2. **Update `infra/monitoring/prometheus.yml`** (around line 46) with the new target

**Full Guide**: See `docs/RAILWAY-CONFIGURATION.md` for detailed instructions.

### Step 2: Deploy to Railway

Railway will automatically:
- Expose your `/metrics` endpoint
- Allow Prometheus to scrape metrics
- Use Railway's monitoring services (if configured)

### Step 3: Configure Grafana Cloud (Optional)

If using Grafana Cloud, update the `remote_write` section in `prometheus.yml`:

```yaml
remote_write:
  - url: 'https://prometheus-prod-XX-prod-YY-ZZ.grafana.net/api/prom/push'
    basic_auth:
      username: 'YOUR_GRAFANA_USERNAME'
      password: 'YOUR_GRAFANA_CLOUD_TOKEN'
```

## 📋 Configuration

### Prometheus Target

**Local Development:**
```yaml
targets:
  - 'localhost:3000'
```

**Railway Production:**
```yaml
targets:
  - 'your-app.railway.app:443'
```

### Environment Variables

The Coordinator service should expose:
- `/metrics` endpoint (Prometheus format)
- `/health` endpoint (optional, for health checks)

## 📊 Access Points

**Local Development:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:4000 (Docker) or http://localhost:3000 (local install)
- Coordinator: http://localhost:3000

**Railway Production:**
- Coordinator: `https://your-app.railway.app`
- Metrics: `https://your-app.railway.app/metrics`

## 📈 Viewing Grafana Dashboard

**Quick Start:**
1. Start Grafana: `npm run monitoring:docker:start` (or install locally)
2. Access: http://localhost:4000 (Docker) or http://localhost:3000 (local)
3. Login: `admin` / `admin`
4. Dashboard should auto-import, or import `infra/monitoring/grafana-dashboard-coordinator.json`

**Full Guide:** See `docs/GRAFANA-QUICK-START.md` for detailed instructions.

## 🎯 What's Included

✅ **Prometheus Configuration** - Ready for localhost or Railway  
✅ **Grafana Dashboard** - Pre-configured panels  
✅ **Alert Rules** - Service health and security alerts  
✅ **Metrics Endpoint** - `/metrics` endpoint in Coordinator service  

## 📚 Documentation

- **Full Guide**: `docs/monitoring-usage-guide.md`
- **Setup Details**: `docs/monitoring-setup.md`
- **Team 4 Orchestrator**: `docs/team4-orchestrator.md`

## 🐛 Troubleshooting

### Prometheus can't scrape metrics

1. **Check Coordinator is running**: `curl http://localhost:3000/health`
2. **Check metrics endpoint**: `curl http://localhost:3000/metrics`
3. **Verify target in prometheus.yml** matches your Coordinator URL

### Metrics not appearing in Grafana

1. **Check Prometheus has data**: Query `up{job="coordinator"}` in Prometheus UI
2. **Verify Grafana data source** points to Prometheus
3. **Check time range** in Grafana (try "Last 5 minutes")

---

**For Railway deployment, simply update the target URL in `prometheus.yml`! 🚂**
