# 🔧 Fix: Dashboard Shows No Panels

## 🐛 Problem

Dashboard is imported but shows no panels (empty dashboard).

## ✅ Quick Fixes

### Fix 1: Check Data Source Connection

**Most common issue!**

1. **Open Grafana**: http://localhost:4000
2. **Go to**: Configuration → Data Sources
3. **Check**: Prometheus should show green checkmark ✅
4. **If not connected**:
   - Click on **Prometheus**
   - **URL**: Should be `http://prometheus:9090` (Docker) or `http://localhost:9090` (local)
   - Click **Save & Test**
   - Should show: "Data source is working"

### Fix 2: Verify Dashboard Has Data Source Set

1. **Open the dashboard**
2. **Click**: Settings (gear icon) → Variables (if any)
3. **Check**: Each panel should have Prometheus selected as data source
4. **If not**:
   - Click on a panel
   - Click **Edit**
   - Select **Prometheus** as data source
   - Click **Apply**

### Fix 3: Check Time Range

1. **Top right corner** of dashboard
2. **Click**: Time range selector
3. **Try**: "Last 5 minutes" or "Last 1 hour"
4. **Click**: Apply

### Fix 4: Verify Prometheus Has Data

1. **Open Prometheus**: http://localhost:9090
2. **Go to**: Graph tab
3. **Query**: `up{job="coordinator"}`
4. **Should return**: `1` (means target is UP)
5. **Query**: `http_requests_total{service="coordinator"}`
6. **Should return**: Some values (not empty)

**If no data:**
- Check Prometheus targets: Status → Targets (should be UP)
- Generate some traffic to your Railway app
- Wait a few minutes for metrics to accumulate

### Fix 5: Check Panel Queries

1. **Click on a panel** (even if empty)
2. **Click**: Edit
3. **Check**: The query in the query editor
4. **Verify**: Data source is set to **Prometheus**
5. **Test query**: Click "Run query" or press Ctrl+Enter
6. **Should show**: Data or "No data"

**If query fails:**
- Check the metric name matches what's in Prometheus
- Verify labels match (e.g., `service="coordinator"`)

### Fix 6: Re-import Dashboard

1. **Delete** the current dashboard
2. **Re-import**: Dashboards → Import
3. **Upload**: `infra/monitoring/grafana-dashboard-coordinator.json`
4. **Select**: Prometheus as data source
5. **Click**: Import

---

## 🔍 Diagnostic Steps

### Step 1: Check Prometheus Has Metrics

**In Prometheus UI** (http://localhost:9090):

```promql
# Test these queries:
up{job="coordinator"}                    # Should return 1
http_requests_total{service="coordinator"}  # Should return values
process_start_time_seconds{job="coordinator"}  # Should return timestamp
```

**If these return "No data":**
- Prometheus isn't scraping your Railway app
- Check: Status → Targets (should be UP)
- Check: Railway app is running and exposes `/metrics`

### Step 2: Check Grafana Data Source

**In Grafana** (http://localhost:4000):

1. Configuration → Data Sources → Prometheus
2. **URL should be**:
   - Docker: `http://prometheus:9090`
   - Local: `http://localhost:9090`
3. **Click**: Save & Test
4. **Should show**: "Data source is working"

### Step 3: Test a Simple Query in Grafana

1. **Open dashboard**
2. **Click**: Add panel → Add visualization
3. **Query**: `up{job="coordinator"}`
4. **Data source**: Prometheus
5. **Click**: Run query
6. **Should show**: Data

**If this works**: The issue is with the dashboard panels
**If this doesn't work**: The issue is with data source or Prometheus

---

## 🎯 Common Issues & Solutions

### Issue: "No data" in all panels

**Cause**: No metrics collected yet or time range too narrow

**Solution**:
1. Generate traffic: `curl https://ms8-learning-analytics-production.up.railway.app/health`
2. Wait 1-2 minutes
3. Change time range to "Last 1 hour"
4. Refresh dashboard

### Issue: Panels show but are empty

**Cause**: Queries don't match metric names/labels

**Solution**:
1. Check actual metric names in Prometheus
2. Verify labels match (e.g., `service="coordinator"`)
3. Edit panel queries to match

### Issue: "Datasource not found"

**Cause**: Data source not configured or wrong name

**Solution**:
1. Configuration → Data Sources
2. Ensure Prometheus data source exists
3. Re-import dashboard and select Prometheus

### Issue: Dashboard JSON structure issue

**Cause**: Dashboard JSON might be corrupted

**Solution**:
1. Verify JSON is valid: `infra/monitoring/grafana-dashboard-coordinator.json`
2. Re-import the dashboard
3. Check Grafana logs for errors

---

## 🧪 Quick Test

**Test if everything works:**

1. **Prometheus**: http://localhost:9090
   - Query: `up{job="coordinator"}` → Should return `1`

2. **Grafana**: http://localhost:4000
   - Create new panel
   - Query: `up{job="coordinator"}`
   - Should show data

3. **If both work**: Re-import dashboard
4. **If Prometheus works but Grafana doesn't**: Check data source connection
5. **If neither works**: Check Prometheus is scraping Railway

---

## 📋 Checklist

- [ ] Prometheus target shows UP (http://localhost:9090/targets)
- [ ] Prometheus has data (query `up{job="coordinator"}` returns 1)
- [ ] Grafana data source is connected (green checkmark)
- [ ] Time range is set correctly (try "Last 1 hour")
- [ ] Dashboard panels have Prometheus selected as data source
- [ ] Railway app is running and exposing `/metrics`
- [ ] Some traffic has been generated (metrics need data)

---

**Most likely fix**: Check data source connection and time range! 🎯

