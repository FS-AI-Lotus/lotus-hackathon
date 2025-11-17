# 🔧 Quick Fix: Dashboard Shows No Panels

## ⚡ Most Common Fixes (Try These First!)

### Fix 1: Check Data Source (90% of issues!)

1. **Open Grafana**: http://localhost:4000
2. **Go to**: Configuration → Data Sources
3. **Check**: Prometheus should show **green checkmark** ✅
4. **If not**:
   - Click **Prometheus**
   - **URL**: `http://prometheus:9090` (Docker) or `http://localhost:9090` (local)
   - Click **Save & Test**
   - Should show: "Data source is working"

### Fix 2: Set Time Range

1. **Top right** of dashboard
2. **Click**: Time range (e.g., "Last 6 hours")
3. **Try**: "Last 5 minutes" or "Last 1 hour"
4. **Click**: Apply

### Fix 3: Verify Prometheus Has Data

1. **Open Prometheus**: http://localhost:9090
2. **Go to**: Graph tab
3. **Query**: `up{job="coordinator"}`
4. **Should return**: `1` (means UP)

**If returns "No data":**
- Check: Status → Targets (should be UP)
- Generate traffic: `curl https://ms8-learning-analytics-production.up.railway.app/health`

### Fix 4: Re-import Dashboard

1. **Delete** current dashboard
2. **Import again**: Dashboards → Import
3. **Upload**: `infra/monitoring/grafana-dashboard-coordinator.json`
4. **Select**: Prometheus as data source
5. **Click**: Import

---

## 🧪 Quick Diagnostic Test

**Test if data source works:**

1. **In Grafana**: Click **+** → **Create** → **Dashboard**
2. **Add panel** → **Add visualization**
3. **Query**: `up{job="coordinator"}`
4. **Data source**: Prometheus
5. **Click**: Run query

**If this shows data**: Dashboard panels need data source set
**If this shows "No data"**: Check Prometheus connection

---

## 📋 Step-by-Step Fix

### Step 1: Verify Data Source

```
Configuration → Data Sources → Prometheus → Should show ✅
```

### Step 2: Check Prometheus Has Data

```
http://localhost:9090 → Graph → Query: up{job="coordinator"} → Should return 1
```

### Step 3: Edit Dashboard Panels

1. **Open dashboard**
2. **Click**: Settings (gear) → **Edit dashboard**
3. **For each panel**:
   - Click panel → Edit
   - Check data source is set to **Prometheus**
   - If not, select **Prometheus**
   - Click **Apply**

### Step 4: Check Time Range

- **Top right**: Set to "Last 1 hour"
- **Click**: Apply

---

## ✅ Success Checklist

- [ ] Prometheus data source shows green checkmark ✅
- [ ] Prometheus query `up{job="coordinator"}` returns `1`
- [ ] Dashboard time range is set (try "Last 1 hour")
- [ ] Panels have Prometheus selected as data source
- [ ] Some traffic has been generated to Railway app

---

**Most likely issue**: Data source not connected or time range too narrow! 🎯

