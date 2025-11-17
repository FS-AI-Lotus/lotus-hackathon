# ⚡ Quick Start - Railway Production Monitoring

## ✅ Current Configuration

Your Railway URL is **already configured**:
- **URL**: `ms8-learning-analytics-production.up.railway.app:443`
- **File**: `infra/monitoring/prometheus.yml`

## 🚀 Quick Setup

### Step 1: Verify Your Railway App

Make sure your Railway app is running and exposes `/metrics`:

```bash
# Test the metrics endpoint
curl https://ms8-learning-analytics-production.up.railway.app/metrics
```

You should see Prometheus-formatted metrics.

### Step 2: Start Prometheus

**Option A: Run Prometheus Locally**

```bash
# Install Prometheus (if not installed)
# Mac: brew install prometheus
# Windows: Download from https://prometheus.io/download/

# Start Prometheus with your config
prometheus --config.file=./infra/monitoring/prometheus.yml
```

**Option B: Use Docker (Optional)**

```bash
npm run monitoring:docker:start
```

### Step 3: Access Prometheus

1. Open: http://localhost:9090
2. Go to: **Status → Targets**
3. Your Railway target should show as **UP** (green)

### Step 4: View in Grafana

1. Start Grafana: `npm run monitoring:docker:start` (or install locally)
2. Access: http://localhost:4000
3. Login: `admin` / `admin`
4. Import dashboard: `infra/monitoring/grafana-dashboard-coordinator.json`

## 🔄 Changing Railway URL in the Future

**Simple 2-step process:**

1. **Update `RAILWAY-URL.config`**:
   ```
   RAILWAY_URL=your-new-app.railway.app
   ```

2. **Update `infra/monitoring/prometheus.yml`** (line 46):
   ```yaml
   - 'your-new-app.railway.app:443'
   ```

That's it! The configuration is generic and easy to update.

## 📚 Full Documentation

- **Railway Configuration Guide**: `docs/RAILWAY-CONFIGURATION.md`
- **Grafana Quick Start**: `docs/GRAFANA-QUICK-START.md`
- **Monitoring Usage**: `docs/monitoring-usage-guide.md`

---

**Your Railway monitoring is ready! 🚂**

