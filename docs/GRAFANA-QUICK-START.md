# 📊 How to View Monitoring with Grafana

## 🚀 Quick Access

### Option 1: Using Docker (Easiest)

**Start Grafana with Docker:**
```bash
npm run monitoring:docker:start
```

**Access Grafana:**
- **URL**: http://localhost:4000
- **Username**: `admin`
- **Password**: `admin`

The dashboard should **auto-import** and be ready to view!

---

### Option 2: Install Grafana Locally

**Install Grafana:**
- **Mac**: `brew install grafana`
- **Windows**: Download from https://grafana.com/grafana/download
- **Linux**: `sudo apt-get install grafana` or `sudo yum install grafana`

**Start Grafana:**
```bash
# Mac/Linux
brew services start grafana
# or
sudo systemctl start grafana-server

# Windows
# Run Grafana as a service or start manually
```

**Access Grafana:**
- **URL**: http://localhost:3000
- **Username**: `admin`
- **Password**: `admin` (you'll be prompted to change it)

---

## 📈 Step-by-Step: View Your Dashboard

### Step 1: Access Grafana

1. Open your browser
2. Go to:
   - **Docker**: http://localhost:4000
   - **Local**: http://localhost:3000
3. Login with:
   - Username: `admin`
   - Password: `admin`

### Step 2: Configure Prometheus Data Source

**If using Docker:** This is already configured automatically! Skip to Step 3.

**If running Grafana locally:**

1. Click **Configuration** (gear icon) → **Data Sources**
2. Click **Add data source**
3. Select **Prometheus**
4. Configure:
   - **URL**: `http://localhost:9090` (where Prometheus is running)
   - **Access**: Server (default)
5. Click **Save & Test**
   - ✅ Should show "Data source is working"

### Step 3: Import the Dashboard

**If using Docker:** The dashboard should already be imported! Go to **Dashboards** → **Coordinator Service - Monitoring Dashboard**

**If running Grafana locally:**

1. Click **Dashboards** (four squares icon) → **Import**
2. Click **Upload JSON file**
3. Select: `infra/monitoring/grafana-dashboard-coordinator.json`
4. Click **Load**
5. Select **Prometheus** as the data source
6. Click **Import**

### Step 4: View Your Metrics! 🎉

The dashboard includes:

#### **Request Metrics**
- **Requests per Second** - Graph showing request rate
- **Total Requests** - Total count
- **Error Rate** - Percentage of errors

#### **Latency Metrics**
- **p95 Latency by Route** - 95th percentile latency
- **p50 Latency** - Median latency
- **p95 Latency** - 95th percentile latency

#### **Business Metrics**
- **Service Registrations** - Registration counts
- **Routing Operations** - Success vs failed routing
- **HTTP Status Codes** - Status code distribution

#### **System Metrics**
- **Uptime** - How long the service has been running
- **Active Alerts** - Current alert status

---

## ✅ Verification Checklist

Before viewing, make sure:

- [ ] **Prometheus is running** and scraping metrics
  - Check: http://localhost:9090 → Status → Targets (should be UP)
- [ ] **Coordinator service is running** on port 3000
  - Check: `curl http://localhost:3000/health`
- [ ] **Metrics endpoint is working**
  - Check: `curl http://localhost:3000/metrics` (should return Prometheus format)
- [ ] **Grafana data source is connected**
  - Check: Configuration → Data Sources → Prometheus (should show green checkmark)

---

## 🐛 Troubleshooting

### Dashboard Shows "No Data"

**Possible causes:**
1. **Prometheus isn't scraping** - Check Prometheus targets
2. **No traffic yet** - Generate some requests to your service
3. **Time range too narrow** - Try "Last 5 minutes" or "Last 1 hour"
4. **Data source not connected** - Verify Prometheus data source

**Solutions:**
```bash
# Generate test traffic
.\test-traffic.ps1  # Windows
./test-traffic.sh   # Linux/Mac

# Check Prometheus has data
# Open: http://localhost:9090/graph
# Query: up{job="coordinator"}
# Should return: 1
```

### Can't Access Grafana

**Docker:**
```bash
# Check if Grafana is running
npm run monitoring:docker:status

# Check logs
npm run monitoring:docker:logs
```

**Local:**
```bash
# Check if Grafana is running
# Mac: brew services list
# Linux: sudo systemctl status grafana-server
```

### Dashboard Not Auto-Importing (Docker)

The dashboard should auto-import, but if it doesn't:

1. Go to **Dashboards** → **Import**
2. Upload `infra/monitoring/grafana-dashboard-coordinator.json`
3. Select Prometheus data source
4. Click **Import**

---

## 🎯 Quick Commands Reference

```bash
# Start everything (Docker)
npm run monitoring:docker:start

# Check status
npm run monitoring:docker:status

# View logs
npm run monitoring:docker:logs

# Stop
npm run monitoring:docker:stop

# Start test server (generate metrics)
npm start
# or
node test-server.js

# Generate test traffic
.\test-traffic.ps1  # Windows
./test-traffic.sh   # Linux/Mac
```

---

## 📊 What You Should See

Once everything is working:

1. **Dashboard loads** with multiple panels
2. **Panels show data** (not "No data")
3. **Metrics update** every 10 seconds (auto-refresh)
4. **Graphs show trends** over time
5. **Stats show current values**

**Example:**
- Requests per Second: `2.5 req/s`
- Total Requests: `1,234`
- Error Rate: `0%`
- p95 Latency: `45ms`

---

**That's it! Your monitoring dashboard is ready! 🎉**

