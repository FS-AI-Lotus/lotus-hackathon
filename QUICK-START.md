# ⚡ Quick Start - Team 4 Monitoring

## 🎯 Local Development (Recommended)

### Step 1: Start Your Coordinator Service

```bash
npm start
# or
node test-server.js  # For testing
```

Your service should expose:
- `/metrics` endpoint (Prometheus format)
- `/health` endpoint (optional)

### Step 2: Configure Prometheus

Edit `infra/monitoring/prometheus.yml` - target is already set to `localhost:3000`.

### Step 3: Run Prometheus Locally

**Install Prometheus** (if not installed):
- Download from: https://prometheus.io/download/
- Or use package manager: `brew install prometheus` (Mac) / `choco install prometheus` (Windows)

**Start Prometheus:**
```bash
prometheus --config.file=./infra/monitoring/prometheus.yml
```

### Step 4: Verify

1. **Prometheus**: http://localhost:9090 → Status → Targets (should be UP)
2. **Query metrics**: http://localhost:9090/graph → Query `up{job="coordinator"}`

## 🚂 Railway Production

### Step 1: Update Prometheus Config

Edit `infra/monitoring/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'coordinator'
    static_configs:
      - targets:
          - 'your-app.railway.app:443'  # Your Railway URL
```

### Step 2: Deploy

Railway will automatically expose your `/metrics` endpoint.

## 🐳 Optional: Docker Setup

If you prefer Docker for local development:

```bash
npm run monitoring:docker:start
```

**Note:** Docker is optional. The primary approach is localhost for local dev, Railway URL for production.

## 📚 More Information

- **Full Guide**: `README-monitoring.md`
- **Usage Guide**: `docs/monitoring-usage-guide.md`
- **Team 4 Orchestrator**: `docs/team4-orchestrator.md`

---

**That's it! Simple and clean. 🎉**
