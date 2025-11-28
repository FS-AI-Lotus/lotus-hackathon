# 🚂 Railway New Project Setup Guide

This guide will help you deploy your project to a new Railway project from scratch.

## 📋 Prerequisites

1. A Railway account (sign up at https://railway.app)
2. A new Railway project created
3. GitHub repository connected (optional, but recommended)

---

## 🔧 Step 1: Get Railway Credentials

### Get Railway Token

1. Go to [Railway Dashboard](https://railway.app)
2. Click on your profile → **Settings**
3. Go to **Tokens** tab
4. Click **New Token**
5. Give it a name (e.g., "GitHub Actions")
6. **IMPORTANT:** Make sure to select **"Full Access"** or at least **"Deploy"** permissions
7. Copy the token (you'll only see it once!)
8. **Verify the token format:** It should start with `railway_` and be a long string

### Get Project ID (Optional but Recommended)

1. Go to your Railway project dashboard
2. Click on **Settings** → **General**
3. Copy the **Project ID** (looks like: `abc123-def456-ghi789`)

---

## 🔐 Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value | Required |
|------------|-------|----------|
| `RAILWAY_TOKEN` | Your Railway token from Step 1 | ✅ Yes |
| `RAILWAY_PROJECT_ID` | Your Railway project ID | ❌ Optional (but recommended) |

---

## 🚀 Step 3: Deploy via GitHub Actions

Once you've added the secrets:

1. **Push to main branch** - The workflow will automatically:
   - Run tests
   - Deploy to Railway
   
2. **Or trigger manually:**
   - Go to **Actions** tab in GitHub
   - Select the **CI** workflow
   - Click **Run workflow**

---

## 🎯 Step 4: Configure Railway Project

### Option A: Deploy via Railway Dashboard (Easier - Recommended)

1. Go to your Railway project
2. Click **New Service** → **GitHub Repo**
3. Select your repository
4. Railway will auto-detect Node.js
5. Set the **Root Directory** to: `lotus-hackathon-main/services/coordinator`
6. Railway will automatically deploy on every push

### Option B: Deploy via GitHub Actions (Current Setup)

The GitHub Actions workflow will deploy automatically when you push to `main`.

---

## ⚙️ Step 5: Set Environment Variables in Railway

Go to your Railway service → **Variables** tab and add:

| Variable | Value | Required |
|----------|-------|----------|
| `PORT` | `3000` | ✅ Auto-set by Railway |
| `GRPC_PORT` | `50051` | ❌ Optional |
| `OPENAI_API_KEY` | Your OpenAI API key | ❌ If using AI routing |
| `SUPABASE_URL` | Your Supabase URL | ❌ If using Supabase |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | ❌ If using Supabase |

---

## 🔍 Step 6: Verify Deployment

1. **Check Railway Logs:**
   - Go to Railway dashboard → Your service → **Deployments**
   - Click on the latest deployment → **View Logs**

2. **Test Health Endpoint:**
   ```bash
   curl https://your-service.railway.app/health
   ```
   Should return: `{"status":"ok"}`

3. **Check GitHub Actions:**
   - Go to **Actions** tab
   - Verify the workflow completed successfully

---

## 🐛 Troubleshooting

### Issue: "RAILWAY_TOKEN not found"
**Solution:** Make sure you added `RAILWAY_TOKEN` as a GitHub secret.

### Issue: "Unauthorized. Please login with `railway login`"
**Solution:** 
- **Verify token format:** The token should start with `railway_` (e.g., `railway_abc123...`)
- **Check token permissions:** Make sure the token has "Full Access" or "Deploy" permissions
- **Regenerate token:** Delete the old token and create a new one
- **Verify in GitHub:** Make sure the secret value in GitHub matches exactly (no extra spaces, newlines)
- **Test token locally:** Run `RAILWAY_TOKEN=your_token railway whoami` to verify it works

### Issue: "Project not found"
**Solution:** 
- Verify your `RAILWAY_PROJECT_ID` is correct
- Or remove `RAILWAY_PROJECT_ID` secret and let Railway auto-detect

### Issue: "Deployment failed"
**Solution:**
- Check Railway logs for errors
- Verify all environment variables are set
- Check that the root directory is correct: `lotus-hackathon-main/services/coordinator`

### Issue: "Service not starting"
**Solution:**
- Verify `PORT` environment variable is set (Railway sets this automatically)
- Check that your service listens on `process.env.PORT || 3000`
- Review Railway logs for startup errors

### Issue: "Authentication failed" in GitHub Actions
**Solution:**
1. **Verify token is correct:**
   - Go to Railway → Settings → Tokens
   - Check if the token exists and hasn't expired
   - Create a new token if needed
2. **Check GitHub secret:**
   - Go to GitHub → Settings → Secrets → Actions
   - Verify `RAILWAY_TOKEN` value matches exactly (copy-paste, no spaces)
3. **Token permissions:**
   - Make sure the token has "Full Access" permissions
   - Some tokens might be read-only
4. **Test locally:**
   ```bash
   export RAILWAY_TOKEN="your_token_here"
   railway whoami
   ```
   If this works locally but not in GitHub Actions, the issue is with the secret value

---

## 📝 Quick Checklist

- [ ] Created new Railway project
- [ ] Got Railway token
- [ ] Got Railway project ID (optional)
- [ ] Added `RAILWAY_TOKEN` to GitHub secrets
- [ ] Added `RAILWAY_PROJECT_ID` to GitHub secrets (optional)
- [ ] Set environment variables in Railway
- [ ] Pushed to main branch or triggered workflow
- [ ] Verified deployment in Railway dashboard
- [ ] Tested health endpoint

---

## 🎉 Next Steps

Once deployed:

1. **Get your service URL** from Railway dashboard
2. **Update other services** to use this coordinator URL
3. **Set up other microservices** (ms1, ms2) if needed
4. **Configure domain** (optional) in Railway → Settings → Domains

---

## 💡 Tips

- Railway automatically detects Node.js projects
- No Dockerfile needed (unless you want custom builds)
- Railway sets `PORT` automatically - use `process.env.PORT` in your code
- Check Railway logs if something goes wrong
- Railway provides public URLs automatically

---

## 🔗 Useful Links

- [Railway Dashboard](https://railway.app)
- [Railway Documentation](https://docs.railway.app)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

