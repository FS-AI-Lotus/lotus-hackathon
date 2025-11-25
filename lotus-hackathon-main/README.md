# 🚀 Lotus Hackathon – Platform Monorepo

[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway&logoColor=white)](https://railway.app/)

> **Coordinator • Microservices • CI/CD • Docker • Infrastructure • Monitoring**

This repository contains the entire **Lotus Hackathon platform**, including:

- 🎯 Coordinator microservice
- 🔧 Multiple microservices
- 🔄 CI/CD pipelines
- 🐳 Docker builds
- ✅ Smoke testing system
- 🏗️ Terraform infrastructure (planned)
- 📊 Monitoring & Security tools (planned)

All teams collaborate inside this **single monorepo** to deliver one unified cloud-native system.

---

## 📁 Repository Structure

```
repo/
├── services/
│   ├── coordinator/
│   │   ├── server.js
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   │
│   ├── ms1/
│   │   ├── server.js
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   │
│   └── ms2/                    # (optional)
│       ├── server.js
│       ├── package.json
│       ├── Dockerfile
│       └── .dockerignore
│
├── scripts/
│   ├── smoke-tests.sh
│   ├── smoke-tests.js
│   └── test-register.js
│
└── .github/
    └── workflows/
        ├── coordinator-ci.yml
        ├── microservices-ci.yml
        ├── pr-checks.yml
        └── docker-build.yml    # (optional)
```

---

## 🔥 Project Overview

The Lotus platform is a **cloud-native, multi-service system** designed to showcase:

- 🤖 AI-powered routing
- 📝 Dynamic microservice registration
- ✔️ Schema validation
- 🎨 Centralized UI/UX configuration
- 🚀 Deployment automation
- 📈 Monitoring & observability

All infrastructure and services deploy to **Railway Cloud**.

### Why Monorepo?

The monorepo structure simplifies:

- ✅ CI/CD automation
- ✅ Code sharing
- ✅ Team collaboration
- ✅ Container builds
- ✅ Deployment workflows

---

## 👥 Team Responsibilities

### 🟦 Team 1 – Terraform (Infrastructure)

**Goal:** One command deploys the entire system.

**Deliverables:**

- Terraform configuration for:
  - Railway project
  - Coordinator service
  - Microservices
  - Environment IDs
- Automatic outputs (URLs, ENV IDs, credentials)
- Fully reproducible infrastructure:

```bash
terraform apply → full system deployed
```

---

### 🟩 Team 2 – CI/CD (Build, Deploy, Automation)

**Goal:** Fully automated build + deploy pipelines for all services.

**Deliverables:**

- GitHub Actions workflows:
  - Build → Test → Docker Build → Deploy → Smoke Tests
- Automatic deployment on every push to `main`
- Live smoke tests for `/health` and `/register`
- Build logs + preview builds for feature branches
- Reusable workflows for all teams
- Documented environment variables

**Technologies:**

- GitHub Actions
- Railway CLI
- Docker
- Node.js smoke tests

---

### 🟥 Team 3 – Coordinator & Microservices

**Deliverables:**

- Coordinator service
- `/register` endpoint
- `/route` AI-based routing
- Schema registry & validation
- UI/UX configuration (`/ui-settings`)
- Prometheus metrics (`/metrics`)
- Logging (Winston/Pino)
- Dockerfiles for each service

---

### 🟨 Team 4 – Monitoring & Security

**Deliverables:**

- Prometheus scraping for all services
- Grafana dashboards (requests/sec, latency, errors, uptime)
- JWT or mTLS authentication
- Rate limiting, input validation, injection protection
- Alerts for failures, routing errors, security violations

---

## 🐳 Docker

Each service contains its own:

- `Dockerfile`
- `.dockerignore`

All services can be built and run independently.

**Example:**

```bash
docker build -t coordinator ./services/coordinator
docker run -p 3000:3000 coordinator
```

---

## 🌐 Railway Deployment Flow

### Production Deployment

```bash
git push origin main
```

**Automatically:**

1. ✅ Build
2. 🚀 Deploy to Railway
3. 🧪 Run smoke tests
4. ✔️ Mark deployment as successful/failed

> 💡 **100% cloud-based** — no local hosting required.

---

## 🧪 Smoke Tests (Cloud-only)

- **Coordinator:** `scripts/smoke-test-coordinator.js` (expects `SERVICE_URL`)
- **Microservice:** `scripts/smoke-test-microservice.js <service-name> <service-url>`
- **All:** `scripts/smoke-test-all.js` (uses `COORDINATOR_URL`, `MS1_URL`, `MS2_URL`)

> CI also runs built-in curl smoke checks for `/health` and `/register` per service.

---

## 🔐 Required GitHub Secrets

Add in: **GitHub → Settings → Secrets → Actions**

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Railway CLI deploy token |
| `RAILWAY_ENV_COORDINATOR` | Coordinator environment ID |
| `RAILWAY_ENV_MS1` | Microservice 1 env ID |
| `RAILWAY_ENV_MS2` | Microservice 2 env ID |

---

## ⚡ Quick Start (Local Development)

### Coordinator

```bash
cd services/coordinator
npm install
npm start
```

### Microservice (ms1 example)

```bash
cd services/ms1
npm install
npm start
```

**All services expose:**

- `/health`
- `/register`

_(Coordinator also exposes `/route`, `/ui-settings`, `/metrics`)_

> Coordinator `/ui-settings` reads from `ui/ui-ux-config.json` by default.
> Override with `UI_CONFIG_PATH=/path/to/config.json` if needed (e.g., mounted in container).

---

## 🤝 How to Contribute (Simple Workflow)

To keep the monorepo organized and CI/CD stable:

1. **Create a feature branch**

   ```bash
   git checkout -b feature/my-change
   ```

2. **Push → open a Pull Request**

3. **PR runs automated checks** (tests + Docker + smoke tests)

4. **After review & passing CI** → merge into `main`

5. **CI/CD automatically deploys to Railway** ✨

> This workflow ensures safe, stable deployments for all teams.

---

## 📝 License

This project is part of the Lotus Hackathon initiative.

---

## 🙌 Contributors

Made with ❤️ by the Lotus Hackathon teams.

- Team 1: Infrastructure
- Team 2: CI/CD
- Team 3: Core Services
- Team 4: Monitoring & Security

---

**Happy Hacking! 🎉**
