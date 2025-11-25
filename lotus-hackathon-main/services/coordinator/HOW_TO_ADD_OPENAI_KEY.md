# 🔑 How to Add OpenAI API Key - Quick Guide

## Method 1: Create/Edit `.env` File (Local Development)

### Step 1: Navigate to the coordinator directory
```bash
cd services/coordinator
```

### Step 2: Create or edit `.env` file

**If `.env` doesn't exist**, create it with this content:

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
```

**If `.env` already exists**, just add these lines:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
```

### Step 3: Replace `sk-your-api-key-here` with your actual key

1. Get your OpenAI API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Copy the key (it starts with `sk-`)
3. Replace `sk-your-api-key-here` in the `.env` file

**Example:**
```env
OPENAI_API_KEY=sk-proj-abc123xyz789...
```

### Step 4: Restart the service

After adding the key, restart your service:

```bash
# Stop the current service (Ctrl+C)
# Then start again:
npm start
```

---

## Method 2: Using PowerShell (Windows)

### Option A: Create new `.env` file

```powershell
cd services\coordinator

@"
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
"@ | Out-File -FilePath .env -Encoding utf8
```

Then edit the file and replace `sk-your-api-key-here` with your actual key.

### Option B: Add to existing `.env` file

```powershell
cd services\coordinator

Add-Content -Path .env -Value "`n# OpenAI Configuration`nOPENAI_API_KEY=sk-your-api-key-here`nOPENAI_MODEL=gpt-3.5-turbo`nOPENAI_API_URL=https://api.openai.com/v1/chat/completions"
```

Then edit the file and replace `sk-your-api-key-here` with your actual key.

---

## Method 3: Using Command Line (Linux/Mac/WSL)

```bash
cd services/coordinator

# Create .env file
cat > .env << EOF
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
EOF

# Edit the file and replace sk-your-api-key-here
nano .env
# or
vim .env
```

---

## Method 4: Railway Deployment (Production)

When deploying to Railway:

1. Go to your Railway project dashboard
2. Select the `coordinator` service
3. Go to **Variables** tab
4. Click **+ New Variable**
5. Add these variables:

| Variable Name | Value |
|--------------|-------|
| `OPENAI_API_KEY` | `sk-your-actual-key-here` |
| `OPENAI_MODEL` | `gpt-3.5-turbo` (optional) |
| `OPENAI_API_URL` | `https://api.openai.com/v1/chat/completions` (optional) |

6. Save and redeploy

---

## Getting Your OpenAI API Key

1. **Go to**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. **Sign in** or create an account
3. **Click** "Create new secret key"
4. **Name it** (e.g., "Coordinator Service")
5. **Copy the key** immediately (you won't see it again!)
6. **Paste it** in your `.env` file

---

## Verify It's Working

After adding the key and restarting:

1. **Check logs** when service starts:
   ```
   RoutingService initialized { hasApiKey: true, model: 'gpt-3.5-turbo' }
   ```

2. **Test the endpoint**:
   ```bash
   curl http://localhost:3000/route?q=get%20user%20profile
   ```

3. **If you see** `"success": true` with routing decision → ✅ Working!
4. **If you see** fallback routing → Check your API key

---

## Troubleshooting

### ❌ "OPENAI_API_KEY environment variable is not set"
- Make sure `.env` file exists in `services/coordinator/`
- Check the key name is exactly `OPENAI_API_KEY` (case-sensitive)
- Restart the service after adding the key

### ❌ "OpenAI API error: 401"
- Your API key is invalid or expired
- Get a new key from OpenAI platform
- Make sure there are no extra spaces in the key

### ❌ Service uses fallback routing
- Check service logs for error messages
- Verify API key is correct
- Check your OpenAI account has credits

### ✅ Service works without key
- That's normal! It falls back to rule-based routing
- AI routing will work once you add a valid key

---

## Security Reminder

⚠️ **Never commit `.env` file to Git!**
- `.env` should already be in `.gitignore`
- Use Railway environment variables for production
- Don't share your API key publicly

---

**That's it!** 🎉 Your AI routing should now work with OpenAI.


