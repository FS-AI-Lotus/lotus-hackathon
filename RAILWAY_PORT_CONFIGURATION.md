# Railway Port Configuration

## 🎯 Which Port Should Railway Use?

### **Port 3000 - HTTP Server (Express)**
- **This is the port Railway should route HTTP traffic to**
- Express server listens on this port
- Handles all HTTP requests (health, register, route, etc.)
- **Railway should route public HTTP traffic to port 3000**

### **Port 50051 - gRPC Server**
- **This is NOT for Railway's public HTTP traffic**
- Used for internal RAG (Retrieval-Augmented Generation) communication
- Service-to-service communication only
- **Do NOT configure Railway to route to this port**

---

## ✅ Correct Railway Configuration

### HTTP Traffic (Public)
- **Port:** `3000` (or whatever Railway sets via `PORT` env var)
- **Protocol:** HTTP/HTTPS
- **What it handles:** All public API endpoints
  - `/health`
  - `/register`
  - `/route`
  - `/services`
  - etc.

### gRPC Traffic (Internal)
- **Port:** `50051` (or `GRPC_PORT` env var)
- **Protocol:** gRPC
- **What it handles:** Internal RAG communication
- **Not exposed to Railway's public domain**

---

## 🔧 Railway Settings

### What Railway Needs:
1. **HTTP Port:** Railway automatically sets `PORT` environment variable
2. **Railway routes HTTP traffic to:** The port specified in `PORT` env var (default: 3000)
3. **Dockerfile EXPOSE:** Port 3000 (already correct ✅)

### What You Should Do:
1. **Don't set PORT manually** - Railway sets it automatically
2. **Don't configure Railway to route to port 50051** - that's for gRPC only
3. **Railway will automatically route HTTP traffic to port 3000** (or whatever PORT env var is set to)

---

## 📋 Port Summary

| Port | Service | Railway Should Route? | Purpose |
|------|---------|----------------------|---------|
| **3000** | HTTP (Express) | ✅ **YES** | Public HTTP API endpoints |
| **50051** | gRPC | ❌ **NO** | Internal RAG communication only |

---

## 🎯 Answer

**Railway should listen to port 3000** (the HTTP server port).

- Port 3000 = HTTP server (Express) - **Railway routes here** ✅
- Port 50051 = gRPC server - **Internal only, not for Railway** ❌

---

## 🔍 How Railway Works

1. Railway sets `PORT` environment variable automatically (usually 3000)
2. Your Express server listens on `process.env.PORT || 3000`
3. Railway's load balancer routes HTTP traffic to that port
4. gRPC port (50051) is for internal communication only

---

## ✅ Current Configuration

**Dockerfile:**
```dockerfile
EXPOSE 3000  # ✅ Correct - HTTP server port
```

**Code:**
```javascript
const PORT = process.env.PORT || 3000;  // ✅ Railway sets this
const grpcPort = process.env.GRPC_PORT || 50051;  // Internal only
```

**Railway:**
- Automatically sets `PORT` env var
- Routes HTTP traffic to that port
- **No manual configuration needed** ✅

---

## 🚨 If Railway Shows Port Options

If Railway asks which port to use:
- **Select port 3000** (HTTP server)
- **Do NOT select port 50051** (gRPC is internal only)

---

## 📝 Summary

**Railway should route HTTP traffic to port 3000.**

- ✅ Port 3000 = HTTP server (public API)
- ❌ Port 50051 = gRPC server (internal only)

Railway automatically handles this - you don't need to configure it manually. Just make sure Railway sets the `PORT` environment variable (which it does automatically).

