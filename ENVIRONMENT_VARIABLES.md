# 🔧 Environment Variables Reference

Complete list of all environment variables needed for the Coordinator service.

---

## 📋 Required Variables

These variables are **required** for the service to function properly:

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` | Required for database operations |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | OR use `SUPABASE_SERVICE_ROLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (higher privileges) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Alternative to `SUPABASE_ANON_KEY` |

**Note:** You need either `SUPABASE_ANON_KEY` OR `SUPABASE_SERVICE_ROLE_KEY` (not both). Service role key has higher privileges.

---

## 🌐 Server Configuration (Optional)

These variables configure the server behavior. All have defaults:

| Variable | Default | Description | Example | Notes |
|----------|---------|-------------|---------|-------|
| `PORT` | `3000` | HTTP server port | `3000` | **Railway sets this automatically** - don't override unless needed |
| `HOST` | `0.0.0.0` (prod) or `127.0.0.1` (dev) | Server host address | `0.0.0.0` | Usually don't need to set |
| `NODE_ENV` | `development` | Environment mode | `production` | Affects logging and error handling |
| `REGISTRATION_TIMEOUT` | `30000` | Registration request timeout (ms) | `30000` | Increase if Supabase is slow (30s default) |

---

## 🤖 AI Routing Configuration (Optional)

These variables enable and configure AI-powered routing:

| Variable | Default | Description | Example | Notes |
|----------|---------|-------------|---------|-------|
| `AI_ROUTING_ENABLED` | `false` | Enable AI-powered routing | `true` | Must be set to `"true"` (string) |
| `OPENAI_API_KEY` | - | OpenAI API key for AI routing | `sk-...` | Required if `AI_ROUTING_ENABLED=true` |
| `AI_MODEL` | `gpt-4o-mini` | OpenAI model to use | `gpt-4o-mini` | Options: `gpt-4o-mini`, `gpt-4`, `gpt-3.5-turbo` |
| `AI_FALLBACK_ENABLED` | `true` | Enable fallback routing if AI fails | `true` | Set to `"false"` to disable |

---

## 🔌 gRPC Configuration (Optional)

These variables configure gRPC server:

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `GRPC_ENABLED` | `true` | Enable gRPC server | `true` | Set to `"false"` to disable |
| `GRPC_PORT` | `50051` | gRPC server port | `50051` | Change if port conflict |

---

## 🔄 Routing & Fallback Configuration (Optional)

These variables configure routing behavior and cascading fallback:

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `MAX_FALLBACK_ATTEMPTS` | `5` | Maximum fallback attempts | `5` | Number of services to try |
| `MIN_QUALITY_SCORE` | `0.5` | Minimum quality score (0-1) | `0.5` | Quality threshold for responses |
| `STOP_ON_FIRST_SUCCESS` | `true` | Stop on first successful response | `true` | Set to `"false"` to try all |
| `ATTEMPT_TIMEOUT` | `3000` | Timeout per attempt (ms) | `3000` | Milliseconds to wait per service |
| `DEFAULT_PROTOCOL` | `http` | Default communication protocol | `http` | Options: `http`, `grpc` |

---

## 📊 Logging Configuration (Optional)

These variables configure logging behavior:

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `LOG_LEVEL` | `info` | Logging level | `info` | Options: `error`, `warn`, `info`, `debug` |

---

## 🎨 UI/UX Configuration (Optional)

These variables configure UI/UX features:

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `UI_CONFIG_PATH` | - | Path to UI/UX config file | `/app/ui/ui-ux-config.json` | Usually auto-detected |

---

## 🌐 CORS Configuration (Optional)

These variables configure CORS (Cross-Origin Resource Sharing):

| Variable | Default | Description | Example | Notes |
|----------|---------|-------------|---------|-------|
| `ALLOWED_ORIGINS` | `*` (all origins) | Comma-separated list of allowed origins | `https://app.example.com,https://admin.example.com` | Leave unset to allow all origins (development) |

---

## 📝 Quick Setup Guide

### Minimal Setup (Required Only)
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
```

### With AI Routing
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
AI_ROUTING_ENABLED=true
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
```

### Production Setup (Recommended)
```bash
# Required
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000

# Environment
NODE_ENV=production

# AI Routing (if needed)
AI_ROUTING_ENABLED=true
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini

# Logging
LOG_LEVEL=info

# gRPC
GRPC_ENABLED=true
GRPC_PORT=50051
```

---

## 🚨 Important Notes

1. **Railway/Railpack**: The `PORT` variable is usually set automatically by the platform. Don't override it unless necessary.

2. **Supabase Keys**: 
   - `SUPABASE_ANON_KEY` - Public key, safe for client-side (has RLS restrictions)
   - `SUPABASE_SERVICE_ROLE_KEY` - Private key, bypasses RLS (use in server-side only)

3. **Boolean Values**: For boolean env vars, use strings: `"true"` or `"false"` (not actual booleans)

4. **AI Routing**: If `AI_ROUTING_ENABLED=true`, you MUST provide `OPENAI_API_KEY`

5. **Service Without Supabase**: The service will run with in-memory storage if Supabase credentials are missing, but data won't persist.

---

## 🔍 How to Set in Railway/Railpack

1. Go to your project dashboard
2. Navigate to **Variables** or **Environment** section
3. Click **+ New Variable**
4. Add each variable with its value
5. Save and redeploy

---

## ✅ Validation

After setting variables, the service will:
- ✅ Log Supabase connection status on startup
- ✅ Log AI routing status (enabled/disabled)
- ✅ Log gRPC server status
- ⚠️ Warn if required variables are missing

Check the startup logs to verify all configurations are correct.

