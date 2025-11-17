# 📊 Monitoring Usage Guide - Prometheus & Grafana

This guide explains how to set up, verify, and use the Prometheus and Grafana monitoring stack for the Coordinator service.

---

## ⚡ Quick Reference

### Start Test Server (if Coordinator not available)
```bash
# Run the test server to expose /health and /metrics endpoints
node test-server.js
```

### Verify Coordinator Metrics
```bash
# Windows PowerShell
curl http://localhost:3000/metrics

# Windows Git Bash / Linux / Mac
curl http://localhost:3000/metrics
```

### Check Prometheus Connection
1. Open: http://localhost:9090
2. Go to: **Status → Targets**
3. Verify: Coordinator target shows `UP` (green)

### Check Grafana Dashboard
1. Open: http://localhost:3001 (admin/admin)
2. Import dashboard: `infra/monitoring/grafana-dashboard-coordinator.json`
3. Verify: Panels show data (not "No data")

### Generate Test Traffic
```bash
# Windows PowerShell
1..10 | ForEach-Object { curl http://localhost:3000/health; Start-Sleep -Seconds 1 }

# Windows Git Bash / Linux / Mac
for i in {1..10}; do curl http://localhost:3000/health; sleep 1; done
```

---

## 🎯 Overview

The monitoring stack consists of:
1. **Coordinator Service** - Exposes metrics at `/metrics` endpoint
2. **Prometheus** - Scrapes and stores metrics from Coordinator
3. **Grafana** - Visualizes metrics in dashboards

---

## 🚀 Quick Start

### Prerequisites

- Coordinator service running (with `/metrics` endpoint)
- Docker and Docker Compose (for local setup)
- Or access to deployed Prometheus/Grafana instances

### Step 1: Verify Coordinator Metrics Endpoint

First, ensure the Coordinator service is running and exposing metrics.

#### How to Run These Commands

**On Windows (PowerShell):**
```powershell
# Check if Coordinator is running
Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing

# Or using curl (if available in PowerShell 6+)
curl http://localhost:3000/health

# Check metrics endpoint (should return Prometheus format)
curl http://localhost:3000/metrics
```

**On Windows (Git Bash / WSL):**
```bash
# Check if Coordinator is running
curl http://localhost:3000/health

# Check metrics endpoint (should return Prometheus format)
curl http://localhost:3000/metrics
```

**On Linux/Mac:**
```bash
# Check if Coordinator is running
curl http://localhost:3000/health

# Check metrics endpoint (should return Prometheus format)
curl http://localhost:3000/metrics
```

#### If Coordinator Service is Not Running

If you get connection errors like `Connection refused` or `ECONNREFUSED`, you need to:

1. **Start the Coordinator service first** (if it exists in your repo):
   ```bash
   # Navigate to Coordinator directory
   cd coordinator  # or wherever Coordinator service is located
   
   # Install dependencies (if needed)
   npm install
   
   # Start the service
   npm start
   # or
   node server.js
   # or
   node app.js
   ```

2. **Or create a simple test server** to verify metrics endpoint:
   
   Create `test-server.js`:
   ```javascript
   const express = require('express');
   const httpMetricsMiddleware = require('./src/monitoring/httpMetricsMiddleware');
   const metricsEndpoint = require('./src/monitoring/metricsEndpoint');
   
   const app = express();
   app.use(express.json());
   
   // Add metrics middleware
   app.use(httpMetricsMiddleware);
   
   // Health endpoint
   app.get('/health', (req, res) => {
     res.json({ status: 'ok', timestamp: new Date().toISOString() });
   });
   
   // Metrics endpoint
   app.get('/metrics', metricsEndpoint);
   
   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => {
     console.log(`Test server running on http://localhost:${PORT}`);
     console.log(`Health: http://localhost:${PORT}/health`);
     console.log(`Metrics: http://localhost:${PORT}/metrics`);
   });
   ```
   
   Run it:
   ```bash
   node test-server.js
   ```

3. **Verify the service is running:**
   ```bash
   # Should return 200 OK
   curl http://localhost:3000/health
   
   # Should return Prometheus metrics
   curl http://localhost:3000/metrics
   ```

**Expected Output:**
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{service="coordinator",route="/health",method="GET",status="200"} 42

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{service="coordinator",route="/health",method="GET",le="0.1"} 38
...

# HELP coordinator_service_registrations_total Total number of service registrations
# TYPE coordinator_service_registrations_total counter
coordinator_service_registrations_total{status="success"} 15
...
```

**Key Metrics to Look For:**
- ✅ `http_requests_total` - Request counters
- ✅ `http_request_duration_seconds` - Latency histograms
- ✅ `coordinator_service_registrations_total` - Registration counters
- ✅ `coordinator_routing_operations_total` - Routing counters
- ✅ `process_start_time_seconds` - Uptime calculation

---

## 🔧 Setting Up Prometheus

### Option 1: Docker Compose (Recommended for Local)

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./infra/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./infra/monitoring/alerts.yml:/etc/prometheus/alerts.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    environment:
      - COORDINATOR_HOST=host.docker.internal:3000
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./infra/monitoring/grafana-dashboard-coordinator.json:/etc/grafana/provisioning/dashboards/coordinator.json
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    networks:
      - monitoring
    depends_on:
      - prometheus

volumes:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
    driver: bridge
```

**Start the stack:**
```bash
docker-compose up -d
```

### Option 2: Standalone Prometheus

1. **Update `prometheus.yml` with Coordinator host:**
   ```yaml
   scrape_configs:
     - job_name: 'coordinator'
       static_configs:
         - targets: ['localhost:3000']  # Update with your Coordinator host:port
   ```

2. **Start Prometheus:**
   ```bash
   prometheus --config.file=./infra/monitoring/prometheus.yml
   ```

---

## ✅ Verifying Prometheus Connection

### 1. Check Prometheus UI

Open: **http://localhost:9090**

### 2. Verify Target Status

Navigate to: **Status → Targets**

**What to Check:**
- ✅ **State**: Should be `UP` (green)
- ✅ **Last Scrape**: Should show recent timestamp (within last 15 seconds)
- ✅ **Labels**: Should show `service="coordinator"`

**If Target is DOWN:**
- ❌ Check Coordinator is running: `curl http://localhost:3000/health`
- ❌ Check `/metrics` endpoint: `curl http://localhost:3000/metrics`
- ❌ Verify host/port in `prometheus.yml` matches Coordinator
- ❌ Check network connectivity (firewall, Docker networking)

### 3. Query Metrics in Prometheus

Go to: **Graph** tab

**Test Queries:**

```promql
# Total requests per second
sum(rate(http_requests_total{service="coordinator"}[1m]))

# p95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service="coordinator"}[5m])) by (le))

# Error rate percentage
(sum(rate(http_requests_total{service="coordinator",status=~"5.."}[5m])) / sum(rate(http_requests_total{service="coordinator"}[5m]))) * 100

# Service registrations
sum(rate(coordinator_service_registrations_total[5m])) by (status)

# Routing operations
sum(rate(coordinator_routing_operations_total[5m])) by (status)

# Uptime
time() - process_start_time_seconds{job="coordinator"}
```

**Expected Results:**
- ✅ Queries should return numeric values (not "No data")
- ✅ Values should update as you make requests to Coordinator
- ✅ Graphs should show trends over time

### 4. Check Alert Rules

Navigate to: **Alerts** tab

**What to Check:**
- ✅ Alert rules are loaded (from `alerts.yml`)
- ✅ Alert states: `inactive`, `pending`, or `firing`
- ✅ Alert labels and annotations are visible

---

## 📈 Setting Up Grafana

### 1. Access Grafana

Open: **http://localhost:3001**

**Default Credentials:**
- Username: `admin`
- Password: `admin` (change on first login)

### 2. Add Prometheus Data Source

1. Go to: **Configuration → Data Sources**
2. Click **Add data source**
3. Select **Prometheus**
4. Configure:
   - **URL**: `http://prometheus:9090` (Docker) or `http://localhost:9090` (standalone)
   - **Access**: Server (default)
5. Click **Save & Test**
   - ✅ Should show "Data source is working"

### 3. Import Dashboard

**Option A: Import from JSON File**

1. Go to: **Dashboards → Import**
2. Click **Upload JSON file**
3. Select: `infra/monitoring/grafana-dashboard-coordinator.json`
4. Click **Load**
5. Select Prometheus data source
6. Click **Import**

**Option B: Import via Provisioning**

If using Docker Compose with volume mount, dashboard should auto-import.

**Option C: Manual Import**

1. Copy contents of `grafana-dashboard-coordinator.json`
2. Go to: **Dashboards → Import**
3. Paste JSON in **Import via panel json**
4. Click **Load** → **Import**

---

## 📊 Using the Grafana Dashboard

### Dashboard Overview

The dashboard includes these panels:

#### **Top Row: Request Metrics**
1. **Requests per Second** - Graph showing request rate by route/method
2. **Total Requests** - Stat panel with total request count
3. **Error Rate** - Percentage of 5xx errors

#### **Second Row: Latency Metrics**
4. **p95 Latency by Route** - Graph showing 95th percentile latency per route
5. **p50 Latency** - Median latency stat
6. **p95 Latency** - 95th percentile latency stat (with color thresholds)

#### **Third Row: System & Business Metrics**
7. **Uptime** - Service uptime in human-readable format
8. **Service Registrations Over Time** - Graph of registration rate (success/failed)
9. **Total Service Registrations** - Total registration count

#### **Fourth Row: Routing & Status**
10. **Routing Operations - Success vs Failed** - Stacked graph
11. **Total Routing Operations** - Total routing count
12. **HTTP Status Code Distribution** - Pie chart

#### **Fifth Row: Additional Metrics**
13. **Active Alerts** - List of firing alerts
14. **Request Rate by Method** - Bar gauge (GET, POST, etc.)
15. **Error Count by Status** - Bar gauge of error status codes

### Dashboard Features

- **Auto-refresh**: Dashboard refreshes every **10 seconds** (as configured)
- **Time Range**: Default shows last 1 hour
- **Interactive**: Click and drag to zoom, hover for values

---

## 🔍 Verifying Dashboard Connections

### Step 1: Check Data Source Connection

1. Open dashboard
2. Look at any panel
3. **If data shows:**
   - ✅ Connection is working
   - ✅ Prometheus is scraping Coordinator
   - ✅ Metrics are flowing

4. **If panels show "No data":**
   - ❌ Check Prometheus data source is configured
   - ❌ Verify Prometheus is scraping Coordinator (check Prometheus Targets)
   - ❌ Check time range (try "Last 5 minutes")
   - ❌ Verify Coordinator `/metrics` endpoint is working

### Step 2: Generate Test Traffic

To see metrics update in real-time:

```bash
# Generate some requests
for i in {1..10}; do
  curl http://localhost:3000/health
  sleep 1
done

# Or use a tool like Apache Bench
ab -n 100 -c 10 http://localhost:3000/health
```

**What to Watch:**
- ✅ **Requests per Second** panel should show spikes
- ✅ **Total Requests** should increase
- ✅ **p95 Latency** should show values
- ✅ All panels should update within 10-15 seconds

### Step 3: Verify Each Panel

**Check Each Panel Individually:**

1. **Requests per Second**
   - Should show lines for each route/method
   - Values should be > 0 if Coordinator is receiving traffic

2. **Error Rate**
   - Should be 0% or low percentage
   - Should increase if you trigger errors

3. **p95 Latency**
   - Should show latency in seconds
   - Should update as requests are made

4. **Uptime**
   - Should show time since Coordinator started
   - Should increase over time

5. **Service Registrations**
   - Should show registrations if `/register` endpoint is used
   - Should show both "success" and "failed" if applicable

6. **Routing Operations**
   - Should show routing metrics if `/route` endpoint is used

### Step 4: Check Panel Queries

To debug a panel showing "No data":

1. Click panel title → **Edit**
2. Check the **Query** tab
3. Verify:
   - ✅ Data source is selected (Prometheus)
   - ✅ PromQL query is correct
   - ✅ Time range is appropriate

**Common Queries Used:**
```promql
# Requests per second
sum(rate(http_requests_total{service="coordinator"}[1m])) by (route, method)

# p95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service="coordinator"}[5m])) by (le, route, method))

# Error rate
(sum(rate(http_requests_total{service="coordinator",status=~"5.."}[5m])) / sum(rate(http_requests_total{service="coordinator"}[5m]))) * 100
```

---

## 🐛 Troubleshooting

### Problem: Prometheus shows target as DOWN

**Solutions:**
1. **Check Coordinator is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check `/metrics` endpoint:**
   ```bash
   curl http://localhost:3000/metrics | head -20
   ```

3. **Verify host/port in `prometheus.yml`:**
   ```yaml
   - targets: ['localhost:3000']  # Must match Coordinator
   ```

4. **Check Docker networking** (if using Docker):
   - Use `host.docker.internal:3000` on Mac/Windows
   - Use `coordinator:3000` if in same Docker network
   - Use `172.17.0.1:3000` on Linux (Docker bridge IP)

5. **Check Prometheus logs:**
   ```bash
   docker logs prometheus
   # or
   journalctl -u prometheus
   ```

### Problem: Grafana shows "No data"

**Solutions:**
1. **Verify Prometheus data source:**
   - Configuration → Data Sources → Test connection

2. **Check Prometheus has data:**
   - Open Prometheus UI → Graph
   - Query: `up{job="coordinator"}`
   - Should return `1` if target is UP

3. **Check time range:**
   - Try "Last 5 minutes" or "Last 1 hour"
   - Ensure Coordinator was running during that time

4. **Verify metric names:**
   - Check Prometheus for: `http_requests_total{service="coordinator"}`
   - Ensure labels match dashboard queries

5. **Check panel queries:**
   - Edit panel → Query tab
   - Test query directly in Prometheus UI first

### Problem: Metrics not updating

**Solutions:**
1. **Verify auto-refresh:**
   - Dashboard should refresh every 10 seconds
   - Check refresh icon in top-right

2. **Check Prometheus scrape interval:**
   - Default: 15 seconds (in `prometheus.yml`)
   - Metrics update after each scrape

3. **Generate test traffic:**
   ```bash
   # Continuous requests
   watch -n 1 'curl -s http://localhost:3000/health > /dev/null'
   ```

4. **Check Coordinator is receiving requests:**
   - Check Coordinator logs
   - Verify middleware is recording metrics

### Problem: Specific panel shows "No data"

**Solutions:**
1. **Check if metric exists:**
   ```bash
   curl http://localhost:3000/metrics | grep <metric_name>
   ```

2. **Test query in Prometheus:**
   - Copy query from Grafana panel
   - Paste in Prometheus Graph
   - See if it returns data

3. **Check label filters:**
   - Ensure `service="coordinator"` label is present
   - Verify route/method labels match

---

## 📋 Quick Verification Checklist

Use this checklist to verify everything is working:

- [ ] Coordinator service is running
- [ ] `/metrics` endpoint returns Prometheus format
- [ ] Prometheus is running and accessible (http://localhost:9090)
- [ ] Prometheus target shows `UP` status
- [ ] Prometheus queries return data (test in Graph tab)
- [ ] Grafana is running and accessible (http://localhost:3001)
- [ ] Prometheus data source is configured in Grafana
- [ ] Dashboard is imported and visible
- [ ] Dashboard panels show data (not "No data")
- [ ] Panels update when generating test traffic
- [ ] Auto-refresh is working (10-second interval)
- [ ] All required metrics are visible:
  - [ ] Requests per second
  - [ ] p95 latency
  - [ ] Error rate
  - [ ] Uptime
  - [ ] Service registrations
  - [ ] Routing operations

---

## 🔗 Useful Links

- **Prometheus UI**: http://localhost:9090
- **Grafana UI**: http://localhost:3001
- **Coordinator Health**: http://localhost:3000/health
- **Coordinator Metrics**: http://localhost:3000/metrics

---

## 📚 Additional Resources

- [Prometheus Query Documentation](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboard Documentation](https://grafana.com/docs/grafana/latest/dashboards/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/examples/)

---

**Happy Monitoring! 📊✨**

