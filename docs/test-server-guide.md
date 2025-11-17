# 🧪 Test Server Guide - Complete Instructions

This guide shows you how to use the test server to verify **Iteration 5** (Prometheus Metrics) and **Iteration 6** (Prometheus & Grafana Config) deliverables.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Starting the Full Stack](#starting-the-full-stack)
3. [Testing Iteration 5 - Metrics](#testing-iteration-5---metrics)
4. [Testing Iteration 6 - Prometheus & Grafana](#testing-iteration-6---prometheus--grafana)
5. [Complete Testing Workflow](#complete-testing-workflow)
6. [Verification Checklist](#verification-checklist)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- ✅ Docker and Docker Compose installed
- ✅ Node.js installed
- ✅ Dependencies installed: `npm install`

### 3-Step Setup

```bash
# Step 1: Start monitoring stack (Prometheus + Grafana)
npm run monitoring:start
# or
.\scripts\monitoring-setup.ps1 start    # Windows
./scripts/monitoring-setup.sh start     # Linux/Mac

# Step 2: Start test server (in a new terminal)
npm run test-server
# or
node test-server.js

# Step 3: Verify connections
# - Prometheus: http://localhost:9090 → Status → Targets (should be UP)
# - Grafana: http://localhost:3001 (admin/admin) → Dashboard should show data
```

---

## 🎯 Starting the Full Stack

### Terminal 1: Start Monitoring Stack

**Windows (PowerShell):**
```powershell
.\scripts\monitoring-setup.ps1 start
```

**Linux/Mac/Git Bash:**
```bash
./scripts/monitoring-setup.sh start
```

**Or use npm:**
```bash
npm run monitoring:start
```

**Expected Output:**
```
✅ Monitoring stack started!
📊 Prometheus: http://localhost:9090
📈 Grafana:    http://localhost:3001 (admin/admin)
```

### Terminal 2: Start Test Server

```bash
npm run test-server
# or
node test-server.js
```

**Expected Output:**
```
✅ Test Coordinator Service running!

📍 Endpoints:
   Health:    http://localhost:3000/health
   Metrics:   http://localhost:3000/metrics
   Register:  http://localhost:3000/register
   Route:     http://localhost:3000/route
   Services:  http://localhost:3000/services

📊 All requests are automatically tracked in Prometheus metrics!
```

**Keep this terminal open** - the server needs to keep running.

---

## 📊 Testing Iteration 5 - Metrics

### Test 1: Verify Metrics Endpoint

**Windows PowerShell:**
```powershell
# Check metrics endpoint
curl http://localhost:3000/metrics
```

**Linux/Mac/Git Bash:**
```bash
# Check metrics endpoint
curl http://localhost:3000/metrics
```

**Expected Output:**
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{service="coordinator",route="/health",method="GET",status="200"} 1

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{service="coordinator",route="/health",method="GET",le="0.1"} 1

# HELP coordinator_service_registrations_total Total number of service registrations
# TYPE coordinator_service_registrations_total counter
coordinator_service_registrations_total{status="success"} 0

# HELP coordinator_routing_operations_total Total number of routing operations
# TYPE coordinator_routing_operations_total counter
coordinator_routing_operations_total{status="success"} 0

# HELP process_start_time_seconds Unix timestamp of process start time
# TYPE process_start_time_seconds gauge
process_start_time_seconds 1234567890
```

### Test 2: Generate HTTP Metrics

**Windows PowerShell:**
```powershell
# Generate some requests
1..10 | ForEach-Object { 
    curl http://localhost:3000/health
    Start-Sleep -Milliseconds 200
}
```

**Linux/Mac/Git Bash:**
```bash
# Generate some requests
for i in {1..10}; do
    curl http://localhost:3000/health
    sleep 0.2
done
```

**Then check metrics again:**
```bash
curl http://localhost:3000/metrics | grep http_requests_total
```

You should see the counter increased!

### Test 3: Test Service Registration Metrics

**Windows PowerShell:**
```powershell
# Register a service (success)
curl -X POST http://localhost:3000/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"test-service\",\"url\":\"http://localhost:3001\"}'

# Register with invalid data (failure)
curl -X POST http://localhost:3000/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"\"}'
```

**Linux/Mac/Git Bash:**
```bash
# Register a service (success)
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"test-service","url":"http://localhost:3001"}'

# Register with invalid data (failure)
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":""}'
```

**Check metrics:**
```bash
curl http://localhost:3000/metrics | grep coordinator_service_registrations_total
```

You should see both `status="success"` and `status="failed"` counters!

### Test 4: Test Routing Metrics

**Windows PowerShell:**
```powershell
# First, register a service to route to
$registerResponse = curl -X POST http://localhost:3000/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"destination-service\",\"url\":\"http://localhost:3002\"}'

# Extract service ID (you'll need to parse the JSON response)
# For now, use the service name

# Route data (success)
curl -X POST http://localhost:3000/route `
  -H "Content-Type: application/json" `
  -d '{\"origin\":\"client\",\"destination\":\"destination-service\",\"data\":{\"key\":\"value\"}}'

# Route to non-existent service (failure)
curl -X POST http://localhost:3000/route `
  -H "Content-Type: application/json" `
  -d '{\"origin\":\"client\",\"destination\":\"nonexistent\",\"data\":{\"key\":\"value\"}}'
```

**Linux/Mac/Git Bash:**
```bash
# First, register a service to route to
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"destination-service","url":"http://localhost:3002"}'

# Route data (success)
curl -X POST http://localhost:3000/route \
  -H "Content-Type: application/json" \
  -d '{"origin":"client","destination":"destination-service","data":{"key":"value"}}'

# Route to non-existent service (failure)
curl -X POST http://localhost:3000/route \
  -H "Content-Type: application/json" \
  -d '{"origin":"client","destination":"nonexistent","data":{"key":"value"}}'
```

**Check metrics:**
```bash
curl http://localhost:3000/metrics | grep coordinator_routing_operations_total
```

You should see both `status="success"` and `status="failed"` counters!

### Test 5: Test Error Metrics

**Windows PowerShell:**
```powershell
# Generate 500 errors
1..5 | ForEach-Object { curl http://localhost:3000/error }
```

**Linux/Mac/Git Bash:**
```bash
# Generate 500 errors
for i in {1..5}; do curl http://localhost:3000/error; done
```

**Check error metrics:**
```bash
curl http://localhost:3000/metrics | grep http_errors_total
```

You should see `http_errors_total` with `status="500"`!

---

## 📈 Testing Iteration 6 - Prometheus & Grafana

### Test 1: Verify Prometheus is Scraping

1. **Open Prometheus UI**: http://localhost:9090

2. **Check Targets**:
   - Click **Status** → **Targets**
   - Find `coordinator` job
   - **State** should be `UP` (green)
   - **Last Scrape** should show recent timestamp

3. **If Target is DOWN**:
   - Check test server is running: `curl http://localhost:3000/health`
   - Check metrics endpoint: `curl http://localhost:3000/metrics`
   - Check Prometheus logs: `npm run monitoring:logs`

### Test 2: Query Metrics in Prometheus

1. **Go to Graph tab**: http://localhost:9090/graph

2. **Test these queries:**

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

3. **Click Execute** - you should see numeric values (not "No data")

### Test 3: Verify Grafana Dashboard

1. **Open Grafana**: http://localhost:3001
   - Login: `admin` / `admin`

2. **Dashboard should auto-import**:
   - Go to **Dashboards** → **Coordinator Service - Monitoring Dashboard**
   - Or it should be the default home dashboard

3. **Verify all panels show data**:
   - ✅ **Requests per Second** - should show lines
   - ✅ **Error Rate** - should show percentage (0% if no errors)
   - ✅ **p95 Latency** - should show latency values
   - ✅ **Uptime** - should show time since server started
   - ✅ **Service Registrations** - should show success/failed if you registered services
   - ✅ **Routing Operations** - should show success/failed if you routed data

4. **If panels show "No data"**:
   - Check Prometheus data source is configured (should auto-configure)
   - Check time range (try "Last 5 minutes")
   - Generate some traffic (see Complete Testing Workflow below)

### Test 4: Test Dashboard Auto-Refresh

1. **Open Grafana dashboard**: http://localhost:3001

2. **Generate traffic** (in another terminal):
   ```bash
   # Continuous requests
   while true; do curl http://localhost:3000/health; sleep 1; done
   ```

3. **Watch dashboard**:
   - Dashboard should refresh every **10 seconds** automatically
   - Panels should update with new data
   - Graphs should show trends

---

## 🔄 Complete Testing Workflow

### Step-by-Step End-to-End Test

#### Step 1: Start Everything

**Terminal 1 - Monitoring:**
```bash
npm run monitoring:start
```

**Terminal 2 - Test Server:**
```bash
npm run test-server
```

**Wait 10-15 seconds** for everything to start.

#### Step 2: Verify Basic Connectivity

```bash
# Test server health
curl http://localhost:3000/health

# Test metrics endpoint
curl http://localhost:3000/metrics | head -20

# Check Prometheus targets
# Open: http://localhost:9090/targets
# Should show coordinator as UP
```

#### Step 3: Generate Test Traffic

**Create a test script** (`test-traffic.sh` or `test-traffic.ps1`):

**Windows PowerShell (`test-traffic.ps1`):**
```powershell
Write-Host "Generating test traffic..." -ForegroundColor Cyan

# Health checks
Write-Host "1. Health checks..." -ForegroundColor Yellow
1..20 | ForEach-Object { 
    curl http://localhost:3000/health | Out-Null
    Start-Sleep -Milliseconds 100
}

# Service registrations
Write-Host "2. Service registrations..." -ForegroundColor Yellow
1..5 | ForEach-Object {
    $body = @{
        name = "service-$_"
        url = "http://localhost:$((3000 + $_))"
    } | ConvertTo-Json
    
    curl -X POST http://localhost:3000/register `
        -H "Content-Type: application/json" `
        -Body $body | Out-Null
    Start-Sleep -Milliseconds 200
}

# Routing operations
Write-Host "3. Routing operations..." -ForegroundColor Yellow
1..10 | ForEach-Object {
    $body = @{
        origin = "client-$_"
        destination = "service-1"
        data = @{ key = "value-$_" }
    } | ConvertTo-Json
    
    curl -X POST http://localhost:3000/route `
        -H "Content-Type: application/json" `
        -Body $body | Out-Null
    Start-Sleep -Milliseconds 150
}

# Some errors
Write-Host "4. Error requests..." -ForegroundColor Yellow
1..3 | ForEach-Object { 
    curl http://localhost:3000/error | Out-Null
    Start-Sleep -Milliseconds 200
}

Write-Host "✅ Test traffic generated!" -ForegroundColor Green
Write-Host "Check Grafana dashboard: http://localhost:3001" -ForegroundColor Cyan
```

**Linux/Mac/Git Bash (`test-traffic.sh`):**
```bash
#!/bin/bash

echo "Generating test traffic..."

# Health checks
echo "1. Health checks..."
for i in {1..20}; do
    curl -s http://localhost:3000/health > /dev/null
    sleep 0.1
done

# Service registrations
echo "2. Service registrations..."
for i in {1..5}; do
    curl -s -X POST http://localhost:3000/register \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"service-$i\",\"url\":\"http://localhost:$((3000 + i))\"}" > /dev/null
    sleep 0.2
done

# Routing operations
echo "3. Routing operations..."
for i in {1..10}; do
    curl -s -X POST http://localhost:3000/route \
        -H "Content-Type: application/json" \
        -d "{\"origin\":\"client-$i\",\"destination\":\"service-1\",\"data\":{\"key\":\"value-$i\"}}" > /dev/null
    sleep 0.15
done

# Some errors
echo "4. Error requests..."
for i in {1..3}; do
    curl -s http://localhost:3000/error > /dev/null
    sleep 0.2
done

echo "✅ Test traffic generated!"
echo "Check Grafana dashboard: http://localhost:3001"
```

**Run the script:**
```bash
# Windows
.\test-traffic.ps1

# Linux/Mac
chmod +x test-traffic.sh
./test-traffic.sh
```

#### Step 4: Verify in Prometheus

1. **Open**: http://localhost:9090/graph

2. **Run queries:**
   ```promql
   # Should show > 0
   sum(http_requests_total{service="coordinator"})
   
   # Should show registrations
   sum(coordinator_service_registrations_total)
   
   # Should show routing operations
   sum(coordinator_routing_operations_total)
   ```

#### Step 5: Verify in Grafana

1. **Open**: http://localhost:3001

2. **Check all panels:**
   - ✅ Requests per Second - should show activity
   - ✅ Total Requests - should show count
   - ✅ Error Rate - should show small percentage (from error requests)
   - ✅ p95 Latency - should show latency values
   - ✅ Service Registrations - should show success/failed bars
   - ✅ Routing Operations - should show success/failed bars
   - ✅ HTTP Status Code Distribution - should show pie chart
   - ✅ Request Rate by Method - should show GET/POST bars

3. **Verify auto-refresh:**
   - Wait 10 seconds
   - Dashboard should refresh automatically
   - Values should update

#### Step 6: Test Alerts (Optional)

1. **Generate high error rate:**
   ```bash
   # Generate many errors
   for i in {1..50}; do curl http://localhost:3000/error; done
   ```

2. **Check Prometheus Alerts**:
   - Go to: http://localhost:9090/alerts
   - Should see alerts firing (if error rate threshold is exceeded)

---

## ✅ Verification Checklist

Use this checklist to verify everything works:

### Iteration 5 - Metrics ✅

- [ ] `/metrics` endpoint returns Prometheus format
- [ ] `http_requests_total` counter increments with requests
- [ ] `http_request_duration_seconds` histogram records latencies
- [ ] `http_errors_total` counter increments with 5xx errors
- [ ] `coordinator_service_registrations_total` tracks registrations (success/failed)
- [ ] `coordinator_routing_operations_total` tracks routing (success/failed)
- [ ] `process_start_time_seconds` shows server start time
- [ ] All metrics have correct labels (service, route, method, status)

### Iteration 6 - Prometheus & Grafana ✅

- [ ] Prometheus is running (http://localhost:9090)
- [ ] Prometheus target shows `UP` (http://localhost:9090/targets)
- [ ] Prometheus queries return data (not "No data")
- [ ] Grafana is running (http://localhost:3001)
- [ ] Grafana dashboard is imported and visible
- [ ] Prometheus data source is configured in Grafana
- [ ] All dashboard panels show data (not "No data"):
  - [ ] Requests per Second
  - [ ] p95 Latency
  - [ ] Error Rate
  - [ ] Uptime
  - [ ] Service Registrations
  - [ ] Routing Operations
- [ ] Dashboard auto-refreshes every 10 seconds
- [ ] Metrics update in real-time when generating traffic
- [ ] Alert rules are loaded (check http://localhost:9090/alerts)

---

## 🐛 Troubleshooting

### Problem: Test server won't start

**Error**: `Cannot find module './src/monitoring/...'`

**Solution:**
```bash
# Make sure you're in the project root
cd /path/to/lotus-hackathon

# Install dependencies
npm install

# Try again
node test-server.js
```

### Problem: Prometheus target is DOWN

**Symptoms**: http://localhost:9090/targets shows coordinator as DOWN

**Solutions:**

1. **Check test server is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check metrics endpoint:**
   ```bash
   curl http://localhost:3000/metrics
   ```

3. **Check Docker networking** (if using Docker):
   - On Windows/Mac: Prometheus uses `host.docker.internal:3000`
   - On Linux: May need to use `172.17.0.1:3000` or host network mode

4. **Update COORDINATOR_HOST**:
   ```bash
   # Windows
   $env:COORDINATOR_HOST="localhost:3000"
   npm run monitoring:restart
   
   # Linux/Mac
   export COORDINATOR_HOST="localhost:3000"
   npm run monitoring:restart
   ```

### Problem: Grafana shows "No data"

**Solutions:**

1. **Check Prometheus has data:**
   - Open: http://localhost:9090/graph
   - Query: `up{job="coordinator"}`
   - Should return `1`

2. **Check data source:**
   - Grafana → Configuration → Data Sources
   - Prometheus should be configured
   - Click "Save & Test" - should show "Data source is working"

3. **Check time range:**
   - Dashboard → Time range (top right)
   - Try "Last 5 minutes" or "Last 1 hour"
   - Ensure test server was running during that time

4. **Generate traffic:**
   ```bash
   # Generate some requests
   for i in {1..20}; do curl http://localhost:3000/health; sleep 0.5; done
   ```

### Problem: Dashboard panels show "No data"

**Solutions:**

1. **Check Prometheus query directly:**
   - Copy query from panel (Edit panel → Query tab)
   - Paste in Prometheus: http://localhost:9090/graph
   - See if it returns data

2. **Check metric names match:**
   ```bash
   # Check what metrics are available
   curl http://localhost:3000/metrics | grep -E "^[^#]"
   ```

3. **Verify labels:**
   - Metrics should have `service="coordinator"` label
   - Dashboard queries filter by this label

### Problem: Metrics not updating

**Solutions:**

1. **Check auto-refresh:**
   - Dashboard should refresh every 10 seconds
   - Check refresh icon in top-right (should be spinning)

2. **Check Prometheus scrape interval:**
   - Default: 15 seconds
   - Metrics update after each scrape

3. **Generate more traffic:**
   ```bash
   # Continuous requests
   while true; do curl http://localhost:3000/health; sleep 1; done
   ```

---

## 📚 Additional Resources

- **Full Monitoring Guide**: `docs/monitoring-usage-guide.md`
- **Setup Details**: `docs/monitoring-setup.md`
- **Quick Start**: `QUICK-START.md`
- **Monitoring README**: `README-monitoring.md`

---

## 🎉 Success!

If all checklist items are ✅, your Iteration 5 and 6 deliverables are working correctly!

**Next Steps:**
- Test with real Coordinator service (when available)
- Verify alerts fire under failure conditions
- Document any issues or improvements needed

---

**Happy Testing! 🧪✨**

