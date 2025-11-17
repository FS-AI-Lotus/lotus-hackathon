# 🚀 Quick Start - Prometheus Remote Write to Grafana Cloud

## ✅ Configuration Status

**Remote write is already configured!** The `prometheus.yml` file has remote write enabled to send metrics to Grafana Cloud.

## 🎯 3 Simple Steps

### Step 1: Start Prometheus

**Option A: Using npm scripts (Easiest)**
```powershell
npm run monitoring:start
```

**Option B: Using Docker Compose directly**
```powershell
docker compose -f docker-compose.monitoring.yml up -d prometheus
```

**Option C: Using setup script**
```powershell
.\scripts\monitoring-setup.ps1 start
```

### Step 2: Start Test Server (Generate Metrics)

**In a new terminal:**
```powershell
npm start
```

**Generate some traffic:**
```powershell
.\test-traffic.ps1
```

### Step 3: Verify in Grafana Cloud

1. **Log into Grafana Cloud:** https://grafana.com/auth/sign-in/
2. **Open Explore** or create a dashboard
3. **Query metrics:**
   ```promql
   up{job="coordinator"}
   http_requests_total{service="coordinator"}
   ```

**Note:** Grafana is now on port **4000** (not 3001) to avoid Windows port conflicts.

## ✅ Verification Checklist

- [ ] Prometheus is running (`npm run monitoring:status`)
- [ ] Test server is running (`npm start`)
- [ ] Prometheus target is UP (http://localhost:9090/targets)
- [ ] Metrics appear in Grafana Cloud (query `up{job="coordinator"}`)

## 🐛 Troubleshooting

### "docker is not recognized"

**Solution:** Install Docker Desktop or use the npm scripts:
```powershell
npm run monitoring:start
```

### Prometheus not starting

**Check logs:**
```powershell
docker compose -f docker-compose.monitoring.yml logs prometheus
```

### Metrics not appearing in Grafana Cloud

1. **Wait 1-2 minutes** - metrics may take time to appear
2. **Check Prometheus is scraping:** http://localhost:9090/targets
3. **Check remote write logs:**
   ```powershell
   docker compose -f docker-compose.monitoring.yml logs prometheus | Select-String "remote_write"
   ```

## 📚 Full Documentation

See `docs/prometheus-remote-write-setup.md` for complete details.

---

**That's it! Your metrics are now flowing to Grafana Cloud! 🎉**

