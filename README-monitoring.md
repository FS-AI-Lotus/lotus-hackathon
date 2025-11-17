# 📊 Team 4 Monitoring Setup - Quick Start

This is a **standalone monitoring setup** that won't interfere with other teams' deliverables.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js (for test server)

### 1. Start the Monitoring Stack

**Windows (PowerShell):**
```powershell
.\scripts\monitoring-setup.ps1 start
```

**Linux/Mac/Git Bash:**
```bash
chmod +x scripts/monitoring-setup.sh
./scripts/monitoring-setup.sh start
```

This starts:
- **Prometheus** on http://localhost:9090
- **Grafana** on http://localhost:4000 (admin/admin)

### 2. Start Test Server (Optional)

If you don't have the Coordinator service running:

```bash
node test-server.js
```

This starts a test server on http://localhost:3000 with `/health` and `/metrics` endpoints.

### 3. Verify Everything Works

1. **Check Prometheus**: http://localhost:9090
   - Go to **Status → Targets**
   - Coordinator should show as `UP` (green)

2. **Check Grafana**: http://localhost:4000
   - Login: `admin` / `admin`
   - Dashboard should auto-import
   - Panels should show data

## 📋 Available Commands

### Windows (PowerShell)
```powershell
.\scripts\monitoring-setup.ps1 start    # Start services
.\scripts\monitoring-setup.ps1 stop     # Stop services
.\scripts\monitoring-setup.ps1 status   # Check status
.\scripts\monitoring-setup.ps1 check    # Health check
.\scripts\monitoring-setup.ps1 targets  # View Prometheus targets
.\scripts\monitoring-setup.ps1 logs     # View logs
.\scripts\monitoring-setup.ps1 clean    # Remove all data
```

### Linux/Mac/Git Bash
```bash
./scripts/monitoring-setup.sh start     # Start services
./scripts/monitoring-setup.sh stop      # Stop services
./scripts/monitoring-setup.sh status    # Check status
./scripts/monitoring-setup.sh check     # Health check
./scripts/monitoring-setup.sh targets   # View Prometheus targets
./scripts/monitoring-setup.sh logs      # View logs
./scripts/monitoring-setup.sh clean     # Remove all data
```

## 🔧 Configuration

### Change Coordinator Host

If your Coordinator runs on a different host/port:

**Windows:**
```powershell
$env:COORDINATOR_HOST="localhost:3000"
.\scripts\monitoring-setup.ps1 start
```

**Linux/Mac:**
```bash
export COORDINATOR_HOST="localhost:3000"
./scripts/monitoring-setup.sh start
```

### Manual Docker Compose

You can also use Docker Compose directly:

```bash
docker-compose -f docker-compose.monitoring.yml up -d    # Start
docker-compose -f docker-compose.monitoring.yml down    # Stop
docker-compose -f docker-compose.monitoring.yml logs -f # Logs
```

## 📊 Access Points

- **Prometheus UI**: http://localhost:9090
- **Grafana UI**: http://localhost:4000 (admin/admin)
- **Test Server**: http://localhost:3000 (if running)
  - Health: http://localhost:3000/health
  - Metrics: http://localhost:3000/metrics

## 🎯 What This Setup Includes

✅ **Prometheus** - Metrics collection and storage
✅ **Grafana** - Dashboard visualization
✅ **Pre-configured Dashboard** - All required panels
✅ **Alert Rules** - Pre-configured alerts
✅ **Auto Data Source** - Prometheus connected to Grafana
✅ **Isolated Network** - Won't conflict with other services

## 🛡️ Isolation Features

- **Separate Docker network**: `team4-monitoring`
- **Unique container names**: `team4-prometheus`, `team4-grafana`
- **Non-conflicting ports**: Grafana on 3001 (not 3000)
- **Standalone volumes**: Data stored separately

## 📚 More Information

- **Full Guide**: See `docs/monitoring-usage-guide.md`
- **Setup Details**: See `docs/monitoring-setup.md`
- **Dashboard Config**: `infra/monitoring/grafana-dashboard-coordinator.json`
- **Prometheus Config**: `infra/monitoring/prometheus.yml`

## 🐛 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker ps

# Check ports are available
netstat -an | grep 9090  # Prometheus
netstat -an | grep 4000  # Grafana
```

### Prometheus target is DOWN
1. Check Coordinator/test server is running: `curl http://localhost:3000/health`
2. Check metrics endpoint: `curl http://localhost:3000/metrics`
3. Update `COORDINATOR_HOST` if Coordinator is on different host/port

### Grafana shows "No data"
1. Check Prometheus data source is configured (should auto-configure)
2. Check Prometheus has data: http://localhost:9090/graph
3. Query: `up{job="coordinator"}` should return `1`

### Clean start
```bash
# Remove everything and start fresh
.\scripts\monitoring-setup.ps1 clean
.\scripts\monitoring-setup.ps1 start
```

## ✅ Verification Checklist

- [ ] Monitoring stack started (`status` command shows running)
- [ ] Prometheus accessible (http://localhost:9090)
- [ ] Grafana accessible (http://localhost:4000)
- [ ] Coordinator/test server running (http://localhost:3000/health)
- [ ] Prometheus target shows UP (http://localhost:9090/targets)
- [ ] Grafana dashboard shows data (not "No data")
- [ ] Metrics updating when generating traffic

---

**Happy Monitoring! 📊✨**

