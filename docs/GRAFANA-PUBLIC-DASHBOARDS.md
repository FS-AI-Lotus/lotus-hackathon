# 📊 Finding & Importing Grafana Public Dashboards

## 🔍 How to Find Dashboards on grafana.com/dashboards

### Step 1: Browse Grafana Dashboards

1. **Go to**: https://grafana.com/dashboards
2. **Search** for dashboards by:
   - Application name (e.g., "Node.js", "Express", "Prometheus")
   - Technology (e.g., "HTTP", "API", "Microservices")
   - Use case (e.g., "Application Monitoring", "Performance")

### Step 2: Popular Dashboards for Your Stack

**Recommended dashboards for monitoring:**

1. **Node.js Exporter** (ID: 11159)
   - URL: https://grafana.com/dashboards/11159
   - Monitors Node.js application metrics

2. **Prometheus Stats** (ID: 2)
   - URL: https://grafana.com/dashboards/2
   - Monitors Prometheus itself

3. **HTTP API Server** (ID: 11719)
   - URL: https://grafana.com/dashboards/11719
   - HTTP/API monitoring

4. **Express.js** (ID: 10427)
   - URL: https://grafana.com/dashboards/10427
   - Express.js application monitoring

5. **Application Metrics** (ID: 6417)
   - URL: https://grafana.com/dashboards/6417
   - General application metrics

---

## 📥 How to Import from grafana.com/dashboards

### Method 1: Import by Dashboard ID (Easiest)

1. **Open Grafana**: http://localhost:4000
2. **Login**: admin/admin
3. **Go to**: Dashboards → Import
4. **Enter Dashboard ID**: Type the dashboard ID (e.g., `11159`)
5. **Click**: Load
6. **Select**: Prometheus as data source
7. **Click**: Import

**Example:**
- Dashboard ID: `11159` (Node.js Exporter)
- Just type `11159` in the import box and click Load

### Method 2: Import by JSON

1. **Go to**: https://grafana.com/dashboards
2. **Find** the dashboard you want
3. **Click**: "Download JSON"
4. **In Grafana**: Dashboards → Import → Upload JSON file
5. **Select** the downloaded JSON file
6. **Click**: Load → Import

### Method 3: Import via URL

1. **Copy** the dashboard JSON URL from grafana.com
2. **In Grafana**: Dashboards → Import
3. **Paste** the URL in "Import via panel json"
4. **Click**: Load → Import

---

## 🎯 Quick Import Examples

### Import Node.js Exporter Dashboard

```bash
# Dashboard ID: 11159
# URL: https://grafana.com/dashboards/11159
```

**Steps:**
1. Grafana → Dashboards → Import
2. Enter: `11159`
3. Click: Load
4. Select: Prometheus
5. Click: Import

### Import Prometheus Stats Dashboard

```bash
# Dashboard ID: 2
# URL: https://grafana.com/dashboards/2
```

**Steps:**
1. Grafana → Dashboards → Import
2. Enter: `2`
3. Click: Load
4. Select: Prometheus
5. Click: Import

---

## 🔍 Search Tips

### Search by Technology

- **Node.js**: Search "nodejs" or "node.js"
- **Express**: Search "express"
- **HTTP**: Search "http" or "api"
- **Prometheus**: Search "prometheus"
- **Application**: Search "application monitoring"

### Filter Results

On grafana.com/dashboards:
- **Filter by**: Data source (Prometheus)
- **Sort by**: Downloads (most popular)
- **Check**: Last updated date

---

## ✅ Recommended Dashboards for Your Setup

### 1. Node.js Application Monitoring
- **ID**: 11159
- **Name**: Node Exporter Full
- **Use**: Monitor Node.js application metrics
- **URL**: https://grafana.com/dashboards/11159

### 2. Prometheus Self-Monitoring
- **ID**: 2
- **Name**: Prometheus Stats
- **Use**: Monitor Prometheus itself
- **URL**: https://grafana.com/dashboards/2

### 3. HTTP/API Server
- **ID**: 11719
- **Name**: HTTP API Server
- **Use**: HTTP endpoint monitoring
- **URL**: https://grafana.com/dashboards/11719

### 4. Express.js
- **ID**: 10427
- **Name**: Express.js
- **Use**: Express application metrics
- **URL**: https://grafana.com/dashboards/10427

---

## 🎨 Customizing Imported Dashboards

After importing:

1. **Click** the dashboard settings (gear icon)
2. **Edit** panels as needed
3. **Change** data source if needed
4. **Adjust** queries to match your metrics
5. **Save** the dashboard

---

## 📋 Quick Reference

**Grafana Dashboard Library:**
- URL: https://grafana.com/dashboards
- Search: By name, technology, or use case
- Import: By ID (easiest) or JSON

**Your Current Dashboard:**
- UID: `coordinator-monitoring`
- URL: http://localhost:4000/d/coordinator-monitoring
- File: `infra/monitoring/grafana-dashboard-coordinator.json`

---

## 🚀 Quick Import Command Reference

**In Grafana UI:**
1. Dashboards → Import
2. Enter Dashboard ID
3. Load → Select Data Source → Import

**Popular Dashboard IDs:**
- `11159` - Node.js Exporter
- `2` - Prometheus Stats
- `11719` - HTTP API Server
- `10427` - Express.js
- `6417` - Application Metrics

---

**Happy Dashboard Hunting! 🎉**

