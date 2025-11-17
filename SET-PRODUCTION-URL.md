# 🚀 Quick Guide: Set Your Production URL

## ⚡ Super Quick Setup

**To use your Railway URL**, open `infra/monitoring/prometheus.yml` and find line **45**:

```yaml
- 'YOUR_PRODUCTION_URL_HERE:443'  # ⬅️ CHANGE THIS
```

**Replace it with:**
```yaml
- 'ms8-learning-analytics-production.up.railway.app:443'
```

**That's it!** ✅

---

## 📝 Step-by-Step

1. **Open**: `infra/monitoring/prometheus.yml`
2. **Find**: Line 45 (look for `YOUR_PRODUCTION_URL_HERE`)
3. **Replace**: Change `YOUR_PRODUCTION_URL_HERE:443` to `ms8-learning-analytics-production.up.railway.app:443`
4. **Save**: The file

**Before:**
```yaml
- 'YOUR_PRODUCTION_URL_HERE:443'  # ⬅️ CHANGE THIS
```

**After:**
```yaml
- 'ms8-learning-analytics-production.up.railway.app:443'
```

---

## 🔄 Switch Between Production and Local

### For Production (Railway)
```yaml
- 'ms8-learning-analytics-production.up.railway.app:443'
# - 'localhost:3000'  # Keep this commented
```

### For Local Development
```yaml
# - 'ms8-learning-analytics-production.up.railway.app:443'  # Comment this
- 'localhost:3000'  # Uncomment this
```

Also change:
- `scheme: 'http'` (line 34)
- `environment: 'development'` (line 49)

---

## ✅ Verify It Works

After changing the URL:

1. **Test your metrics endpoint**:
   ```bash
   curl https://ms8-learning-analytics-production.up.railway.app/metrics
   ```

2. **Start Prometheus**:
   ```bash
   prometheus --config.file=./infra/monitoring/prometheus.yml
   ```

3. **Check Prometheus targets**: http://localhost:9090 → Status → Targets
   - Should show **UP** (green)

---

**That's all you need! 🎉**

