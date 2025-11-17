# 🚀 Alloy Quick Start - Windows

## Easiest Way: Use Docker (No Installation Needed!)

### Step 1: Uncomment Alloy Service

Open `docker-compose.monitoring.yml` and uncomment the `alloy:` section (remove `#` from lines 66-87).

### Step 2: Start Alloy

**PowerShell:**
```powershell
docker compose -f docker-compose.monitoring.yml up -d alloy
```

**CMD:**
```cmd
docker compose -f docker-compose.monitoring.yml up -d alloy
```

### Step 3: Verify

1. **Check Alloy is running:**
   ```powershell
   docker compose -f docker-compose.monitoring.yml ps alloy
   ```

2. **View Alloy UI:**
   - Open: http://localhost:12345
   - Check component status

3. **Check logs:**
   ```powershell
   docker compose -f docker-compose.monitoring.yml logs -f alloy
   ```

## Alternative: Install Alloy Locally

### Step 1: Download Alloy

1. Go to: https://github.com/grafana/alloy/releases
2. Download: `alloy-windows-amd64.exe` (or appropriate version)
3. Rename to `alloy.exe`
4. Add to PATH or place in project directory

### Step 2: Set Environment Variables

**PowerShell:**
```powershell
$env:COORDINATOR_HOST="localhost:3000"
$env:ENVIRONMENT="development"
```

**CMD:**
```cmd
set COORDINATOR_HOST=localhost:3000
set ENVIRONMENT=development
```

### Step 3: Run Alloy

```powershell
# If alloy.exe is in current directory
.\alloy.exe run --server.http.listen-addr=0.0.0.0:12345 infra/monitoring/alloy.config

# If alloy is in PATH
alloy run --server.http.listen-addr=0.0.0.0:12345 infra/monitoring/alloy.config
```

## Troubleshooting

### "alloy is not recognized"

**Solution:** Use Docker instead (see Step 1 above) - it's easier!

Or install Alloy:
1. Download from GitHub releases
2. Add to PATH or use full path: `.\alloy.exe`

### "export is not recognized" (Windows CMD)

**Solution:** Use `set` instead of `export`:
```cmd
set COORDINATOR_HOST=localhost:3000
```

Or use PowerShell:
```powershell
$env:COORDINATOR_HOST="localhost:3000"
```

### Alloy can't connect to Coordinator

**Solution:** 
- Make sure test server is running: `npm start`
- Check `COORDINATOR_HOST` is set correctly
- If using Docker, use `host.docker.internal:3000` instead of `localhost:3000`

## Full Documentation

See `ALLOY-SETUP.md` for complete instructions.

