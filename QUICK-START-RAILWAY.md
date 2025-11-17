# ⚡ Quick Start - Railway Production Monitoring

## ⚙️ Quick Configuration

**To use your Railway URL**, open `infra/monitoring/prometheus.yml` and find line **45**:

**Find this:**
```yaml
- 'YOUR_PRODUCTION_URL_HERE:443'  # ⬅️ CHANGE THIS
```

**Replace with:**
```yaml
- 'ms8-learning-analytics-production.up.railway.app:443'
```

**That's it!** See `SET-PRODUCTION-URL.md` for detailed instructions.

## 🚀 Quick Setup

### Step 1: Verify Your Railway App

Make sure your Railway app is running and exposes `/metrics`:

```bash
# Test the metrics endpoint
curl https://ms8-learning-analytics-production.up.railway.app/metrics
```

You should see Prometheus-formatted metrics.

### Step 2: Start Prometheus (Use Docker - Easiest!)

**Since Prometheus isn't installed locally, use Docker:**

```bash
npm run monitoring:docker:start
```

This starts:
- ✅ Prometheus (scrapes your Railway app)
- ✅ Grafana (visualizes metrics)

**Why Docker?**
- ✅ No installation needed
- ✅ Already configured
- ✅ Works immediately
- ✅ Free (no Railway service costs)

**Alternative: Install Prometheus Locally**
```bash
# Mac: brew install prometheus
# Windows: Download from https://prometheus.io/download/
# Then: prometheus --config.file=./infra/monitoring/prometheus.yml
```

**Why not Railway?** See `docs/RAILWAY-PROMETHEUS-OPTIONS.md` for details.

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

