# Port Configuration Guide

## Current Port Assignments

To avoid conflicts with other teams and Windows reserved ports, the monitoring stack uses these ports:

- **Coordinator/Test Server**: `3000`
- **Prometheus**: `9090`
- **Grafana**: `4000` (changed from 3001/3002 due to Windows port restrictions)
- **Alloy** (optional): `12345`

## Why Port 4000?

Windows reserves certain port ranges (typically 3000-5000) for exclusive use. Port 4000 is generally available and avoids conflicts.

## Changing Ports

If you need to change Grafana's port, update `docker-compose.monitoring.yml`:

```yaml
grafana:
  ports:
    - "YOUR_PORT:3000"  # Change YOUR_PORT to desired port
  environment:
    - GF_SERVER_ROOT_URL=http://localhost:YOUR_PORT
```

Then restart:
```powershell
docker compose -f docker-compose.monitoring.yml restart grafana
```

## Checking Port Availability

**Windows PowerShell:**
```powershell
netstat -ano | findstr :4000
```

**Windows CMD:**
```cmd
netstat -ano | findstr :4000
```

If nothing is returned, the port is available.

## Common Port Conflicts

- **Port 3000**: Coordinator service
- **Port 3001-3002**: Often reserved by Windows
- **Port 9090**: Prometheus (usually available)
- **Port 4000**: Grafana (usually available)

## Troubleshooting Port Issues

### "Port is not available" Error

1. **Check what's using the port:**
   ```powershell
   netstat -ano | findstr :PORT_NUMBER
   ```

2. **Kill the process (if safe):**
   ```powershell
   taskkill /PID PROCESS_ID /F
   ```

3. **Or change to a different port** in `docker-compose.monitoring.yml`

### Windows Reserved Ports

Windows may reserve ports in ranges like 3000-5000. If you encounter issues:
- Use ports above 5000 (e.g., 8080, 9000)
- Or use ports below 3000 (e.g., 8080, 9090)

---

**Current Configuration:**
- ✅ Coordinator: `3000`
- ✅ Prometheus: `9090`  
- ✅ Grafana: `4000`
- ✅ Alloy: `12345`

