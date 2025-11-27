# Port 3000 and Timeout Issues - Explained

## 🔌 Why Port 3000?

### Default Port
- **Port 3000** is the **default** port when `PORT` environment variable is not set
- Code: `const PORT = process.env.PORT || 3000;`

### Railway Deployment
- **Railway automatically sets the `PORT` environment variable**
- You **don't need to set PORT manually** on Railway
- Railway assigns a port automatically (usually not 3000)
- The service will use whatever port Railway provides

### When to Use Port 3000
- **Local development** - Default port 3000 works fine
- **Docker** - Can use 3000 or any port you configure
- **Railway** - **Don't set PORT** - Railway handles it automatically

### How to Change Port (if needed)
```bash
# Local development
PORT=3001 npm start

# Railway - Don't set this! Railway sets it automatically
# The PORT env var is set by Railway platform
```

---

## ⏱️ Request Timeout Issues

### Why Timeouts Happen

**1. Supabase Connection Slow (Most Common)**
- Registration writes to Supabase database
- Supabase has 15-second timeout for inserts
- If Supabase is slow/unreachable, registration times out
- **Fix:** Service falls back to in-memory storage (still works!)

**2. Multiple Timeout Layers**
- Registration route: 30 seconds (was 20s, now increased)
- Supabase insert: 15 seconds
- Overall registration: 30 seconds

**3. Network Issues**
- Slow connection to Supabase
- Supabase region far from your deployment
- Network latency

---

## ✅ Timeout Fixes Applied

### 1. Increased Registration Timeout
- **Before:** 20 seconds
- **After:** 30 seconds (configurable via `REGISTRATION_TIMEOUT` env var)
- Gives more time for slow Supabase connections

### 2. Fixed Deprecated `req.setTimeout()`
- **Before:** Used deprecated `req.setTimeout()` which doesn't work
- **After:** Proper timeout implementation with cleanup

### 3. Better Error Messages
- Now shows helpful hints when timeout occurs
- Indicates if service may still be registered in memory

---

## 🔧 Configuration

### Registration Timeout (Optional)
```bash
# Increase timeout if Supabase is consistently slow
REGISTRATION_TIMEOUT=45000  # 45 seconds
```

### Port (Usually Not Needed)
```bash
# Local development only
PORT=3001  # Use different port locally

# Railway - DON'T SET THIS
# Railway automatically sets PORT
```

---

## 🎯 What Happens on Timeout

### Scenario 1: Supabase Times Out
1. Registration tries Supabase (15s timeout)
2. Supabase times out
3. **Falls back to in-memory storage**
4. Service is still registered ✅
5. Returns success with serviceId

### Scenario 2: Overall Registration Times Out
1. Registration takes >30 seconds
2. Request times out
3. **But service may still be registered in memory**
4. Returns 504 timeout error
5. **Check `/services` endpoint** - service might be there!

---

## 🔍 How to Diagnose Timeouts

### Check Logs
Look for these messages:
```
[error]: Supabase insert timeout, falling back to in-memory storage
[error]: Registration process timed out after 30 seconds
```

### Check if Service Registered Anyway
```bash
# Even if timeout, service might be registered
GET /services

# If service appears, registration succeeded despite timeout
```

### Test Supabase Connection
```bash
# Check Supabase is reachable
# Look for this in startup logs:
"Supabase client initialized"
```

---

## 🚀 Quick Fixes

### If Getting Timeouts:

1. **Check Supabase Connection**
   - Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
   - Check Supabase dashboard - is it up?

2. **Increase Timeout** (if Supabase is consistently slow)
   ```bash
   REGISTRATION_TIMEOUT=45000  # 45 seconds
   ```

3. **Check Service Anyway**
   - Even on timeout, service might be registered
   - Check: `GET /services`

4. **Use In-Memory Fallback**
   - If Supabase keeps timing out, service uses in-memory storage
   - Still works, but data won't persist across restarts

---

## 📋 Summary

### Port 3000
- ✅ Default for local development
- ✅ Railway sets PORT automatically (don't override)
- ✅ Can change locally: `PORT=3001 npm start`

### Timeouts
- ✅ Increased from 20s to 30s
- ✅ Fixed deprecated timeout implementation
- ✅ Better error messages
- ✅ Service may still register despite timeout (check `/services`)

### Most Common Issue
- **Supabase connection slow** → Registration times out
- **Solution:** Service falls back to in-memory (still works!)
- **Check:** `GET /services` to see if service registered anyway

---

## 🎯 For Railway

**Port:** Railway sets `PORT` automatically - **don't override it**

**Timeout:** If you get timeouts, check:
1. Supabase connection (verify credentials)
2. Network latency to Supabase
3. Service might still be registered (check `/services`)

**Best Practice:** Let Railway handle PORT, only set `REGISTRATION_TIMEOUT` if Supabase is consistently slow.

