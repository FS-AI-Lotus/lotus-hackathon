# ⚡ Quick Start - Team 4 Monitoring

## 🚀 3-Step Setup

### Step 1: Start Monitoring Stack

**Windows:**
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

### Step 2: Start Test Server (Optional)

```bash
npm run test-server
# or
node test-server.js
```

### Step 3: Verify

1. **Prometheus**: http://localhost:9090 → Status → Targets (should be UP)
2. **Grafana**: http://localhost:4000 → Login (admin/admin) → Dashboard should show data

## 📋 Common Commands

```bash
# Start
npm run monitoring:start
# or
.\scripts\monitoring-setup.ps1 start

# Stop
npm run monitoring:stop
# or
.\scripts\monitoring-setup.ps1 stop

# Check status
npm run monitoring:status
# or
.\scripts\monitoring-setup.ps1 status

# View logs
npm run monitoring:logs
# or
.\scripts\monitoring-setup.ps1 logs
```

## 🎯 What You Get

✅ Prometheus on port **9090**  
✅ Grafana on port **4000** (won't conflict with Coordinator on 3000 or Windows reserved ports)  
✅ Pre-configured dashboard  
✅ Auto-connected data source  
✅ Isolated Docker network  
✅ Test server for verification  

## 📚 Full Documentation

- **Quick Start**: `README-monitoring.md`
- **Usage Guide**: `docs/monitoring-usage-guide.md`
- **Setup Details**: `docs/monitoring-setup.md`

---

**That's it! Your monitoring is ready to test! 🎉**

