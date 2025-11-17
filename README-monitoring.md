# 📊 Team 4 Monitoring Setup

## 🎯 Overview

This monitoring setup uses **localhost for local development** and can be easily configured for **Railway production deployment**.

**Key Files:**
- `infra/monitoring/prometheus.yml` - Prometheus configuration (update target URL for Railway)
- `infra/monitoring/alerts.yml` - Alert rules
- `infra/monitoring/grafana-dashboard-coordinator.json` - Grafana dashboard
- `infra/monitoring/grafana-datasource.yml` - Grafana data source config

## 🚀 Local Development Setup

### ⚡ Quick Start (Recommended - Docker)

**Easiest way - no installation needed:**

```bash
npm run monitoring:docker:start
```

This starts:
- ✅ Prometheus (scrapes your Railway app or localhost)
- ✅ Grafana (visualizes metrics)

**Access:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:4000 (admin/admin)

### Option 2: Install Prometheus Locally

1. **Install Prometheus** on your machine
2. **Start Prometheus**: `prometheus --config.file=./infra/monitoring/prometheus.yml`
3. **Install Grafana** and import the dashboard

**Note:** For Railway production monitoring, Docker is recommended (no installation needed).

## 🚂 Railway Production Setup

### ⚡ Quick Configuration

**To use your Railway URL**, open `infra/monitoring/prometheus.yml` and find line **51**:

**Find this:**
```yaml
- 'YOUR_PRODUCTION_URL_HERE:443'  # ⬅️ CHANGE THIS
```

**Replace with:**
```yaml
- 'ms8-learning-analytics-production.up.railway.app:443'
```

**Quick Guide**: See `SET-PRODUCTION-URL.md` for step-by-step instructions.  
**Full Guide**: See `docs/RAILWAY-CONFIGURATION.md` for detailed information.

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
- **Grafana Public Dashboards**: `docs/GRAFANA-PUBLIC-DASHBOARDS.md` - Find and import dashboards from grafana.com/dashboards

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
