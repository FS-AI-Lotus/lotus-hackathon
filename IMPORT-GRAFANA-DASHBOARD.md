# 📊 How to Import Grafana Dashboard

## 🚀 Quick Import Steps

### Step 1: Access Grafana

1. **Open Grafana**: http://localhost:4000
2. **Login**:
   - Username: `admin`
   - Password: `admin`

### Step 2: Import the Dashboard

**Method 1: Upload JSON File (Easiest)**

1. Click **Dashboards** (four squares icon) in the left menu
2. Click **Import**
3. Click **Upload JSON file**
4. Navigate to: `infra/monitoring/grafana-dashboard-coordinator.json`
5. Click **Open**
6. Click **Load**
7. Select **Prometheus** as the data source
8. Click **Import**

**Method 2: Copy/Paste JSON**

1. Click **Dashboards** → **Import**
2. Click **Import via panel json**
3. Open `infra/monitoring/grafana-dashboard-coordinator.json` in a text editor
4. Copy all the JSON content
5. Paste it into Grafana
6. Click **Load**
7. Select **Prometheus** as the data source
8. Click **Import**

**Method 3: Auto-Import (If Using Docker)**

If you're using Docker (`npm run monitoring:docker:start`), the dashboard should **auto-import**!

Just go to:
- **Dashboards** → Look for "Coordinator Service - Monitoring Dashboard"

If it's not there, use Method 1 or 2 above.

---

## ✅ Verify Dashboard is Working

After importing, you should see:

### Dashboard Panels:
- ✅ **Requests per Second** - Graph showing request rate
- ✅ **Total Requests** - Total count
- ✅ **Error Rate** - Percentage of errors
- ✅ **p95 Latency by Route** - 95th percentile latency
- ✅ **p50 Latency** - Median latency
- ✅ **p95 Latency** - 95th percentile latency
- ✅ **Uptime** - Service uptime
- ✅ **Service Registrations** - Registration counts
- ✅ **Routing Operations** - Success vs failed
- ✅ **HTTP Status Codes** - Status code distribution

### If Panels Show "No Data":

1. **Check time range** (top right):
   - Try "Last 5 minutes" or "Last 1 hour"
   
2. **Verify Prometheus has data**:
   - Open: http://localhost:9090
   - Go to: Graph tab
   - Query: `up{job="coordinator"}`
   - Should return: `1`

3. **Check data source**:
   - Configuration → Data Sources
   - Prometheus should show green checkmark ✅
   - If not, click it and click "Save & Test"

4. **Generate some traffic** (if needed):
   ```bash
   curl https://ms8-learning-analytics-production.up.railway.app/health
   curl https://ms8-learning-analytics-production.up.railway.app/metrics
   ```

---

## 📍 Dashboard File Location

The dashboard JSON file is located at:
```
infra/monitoring/grafana-dashboard-coordinator.json
```

---

## 🎯 Quick Access After Import

Once imported, you can access the dashboard anytime:

1. Go to: http://localhost:4000
2. Click **Dashboards** (left menu)
3. Click **Coordinator Service - Monitoring Dashboard**

The dashboard auto-refreshes every 10 seconds!

---

**That's it! Your metrics are now visualized in Grafana! 🎉**

