# ✅ Verification Guide - Complete Setup Check

## Current Status

Based on your terminal output, here's what's running:

✅ **Test Server**: Running on port 3000  
✅ **Prometheus**: Running on port 9090 (healthy)  
✅ **Grafana**: Running on port 4000 (healthy)  
✅ **Remote Write**: Configured to send metrics to Grafana Cloud  

## 🧪 Quick Verification Steps

### Step 1: Verify Test Server

**In PowerShell:**
```powershell
# Test health endpoint
Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing

# Test metrics endpoint
Invoke-WebRequest -Uri http://localhost:3000/metrics -UseBasicParsing | Select-Object -ExpandProperty Content | Select-String "http_requests_total"
```

**Or use curl (if available):**
```powershell
curl http://localhost:3000/health
curl http://localhost:3000/metrics
```

### Step 2: Verify Prometheus is Scraping

1. **Open Prometheus UI**: http://localhost:9090
2. **Check Targets**:
   - Go to: **Status → Targets**
   - Find `coordinator` job
   - Should show: **State: UP** (green)
   - **Last Scrape** should show recent timestamp

3. **Query Metrics**:
   - Go to: **Graph** tab
   - Query: `up{job="coordinator"}`
   - Should return: `1` (means target is UP)

### Step 3: Verify Grafana Dashboard

1. **Open Grafana**: http://localhost:4000
   - Login: `admin` / `admin`

2. **Check Dashboard**:
   - Dashboard should auto-import
   - All panels should show data (not "No data")
   - Dashboard refreshes every 10 seconds

3. **If panels show "No data"**:
   - Generate some traffic first (see Step 4)
   - Check time range (try "Last 5 minutes")

### Step 4: Generate Test Traffic

**Run the test traffic script:**
```powershell
.\test-traffic.ps1
```

**Or manually:**
```powershell
# Generate some requests
1..20 | ForEach-Object { 
    Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing | Out-Null
    Start-Sleep -Milliseconds 200
}
```

**Then check:**
- Prometheus: Query `rate(http_requests_total{service="coordinator"}[1m])` - should show > 0
- Grafana: Dashboard panels should update

### Step 5: Verify Remote Write to Grafana Cloud

1. **Check Prometheus logs:**
   ```powershell
   docker compose -f docker-compose.monitoring.yml logs prometheus | Select-String "remote_write"
   ```
   Should show: `Starting WAL watcher` and `Done replaying WAL`

2. **Check Grafana Cloud**:
   - Log into: https://grafana.com/auth/sign-in/
   - Navigate to Prometheus data source
   - Query: `up{job="coordinator"}`
   - Should return `1` if metrics are arriving

## 📊 Expected Results

### Prometheus (http://localhost:9090)
- ✅ Target shows UP
- ✅ Queries return data
- ✅ Remote write is active

### Grafana (http://localhost:4000)
- ✅ Dashboard loads
- ✅ Panels show data after generating traffic
- ✅ Auto-refresh works (10 seconds)

### Grafana Cloud
- ✅ Metrics appear within 1-2 minutes
- ✅ Queries return data

## 🐛 Troubleshooting

### Test Server Not Responding

**Check if it's running:**
```powershell
Get-Process | Where-Object {$_.ProcessName -eq "node"}
```

**Restart if needed:**
```powershell
npm start
```

### Prometheus Target is DOWN

1. **Check test server is running**: `Invoke-WebRequest http://localhost:3000/health`
2. **Check Prometheus config**: http://localhost:9090/config
3. **Check Prometheus logs**: `docker compose -f docker-compose.monitoring.yml logs prometheus`

### Grafana Shows "No data"

1. **Generate traffic**: `.\test-traffic.ps1`
2. **Check time range**: Try "Last 5 minutes"
3. **Check Prometheus has data**: Query `up{job="coordinator"}` in Prometheus

### Remote Write Not Working

1. **Check Prometheus logs** for errors
2. **Verify credentials** in `prometheus.yml`
3. **Check network connectivity** to Grafana Cloud
4. **Wait 1-2 minutes** for metrics to appear

## ✅ Success Checklist

- [ ] Test server running (`npm start`)
- [ ] Prometheus target shows UP
- [ ] Prometheus queries return data
- [ ] Grafana dashboard shows data
- [ ] Metrics updating in real-time
- [ ] Remote write active (check logs)
- [ ] Metrics appear in Grafana Cloud

---

**Once all checkboxes are ✅, your monitoring setup is complete!** 🎉

