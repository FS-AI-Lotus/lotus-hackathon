# lotus-hackathon

## 🎯 Team 4 - Monitoring & Security Orchestrator

Welcome! This repo contains a **vibe-engineered orchestrator** for systematically implementing production-ready Monitoring & Security features for the **Coordinator service**.

> **📌 Scope Note**: These iterations focus **exclusively on the Coordinator service**. Microservices will be handled in future iterations/loops. The architecture is designed to easily extend to microservices later.

### 🚀 Quick Start

1. **Review the master plan**: Open `docs/team4-iterations.md` - this contains all 9 iterations (0-8) with detailed prompts
2. **Read the orchestrator guide**: Open `docs/team4-orchestrator.md` - this explains how to execute iterations
3. **Track your progress**: Use `npm run progress:status` to see current progress
4. **Start with Iteration 0**: Follow the instructions in `docs/team4-iterations.md`

### 📋 Available Commands

```bash
# Check current progress
npm run progress:status

# See what to do next
npm run progress:next

# Mark an iteration as complete (0-8)
npm run progress check 0

# Full progress tracker help
npm run progress
```

### 📚 Key Documents

- **`docs/team4-iterations.md`** - Master file with all 9 iteration prompts
- **`docs/team4-orchestrator.md`** - Guide on how to use the orchestrator
- **`docs/team4-deliverables-mapping.md`** - Maps hackathon requirements to iterations (ensures 100% coverage)
- **`docs/team4-initial-survey.md`** - Will be created in Iteration 0 (repo survey)

### 🎨 Philosophy

This orchestrator follows **vibe engineering** principles:
- ✨ One iteration at a time
- 🧪 Best practices & comprehensive testing
- 💾 Frequent commits
- 🤝 Ask for help when stuck
- ✨ Keep code clean and well-organized

### 🎯 The 9 Iterations

1. **Iteration 0**: Repo Recon & Test Harness
2. **Iteration 1**: Config, Env Validation & Validation Library
3. **Iteration 2**: Asymmetric JWT Security Core (RS256/ES256)
4. **Iteration 3**: Attach JWT to Routes + Input Validation & Injection Protection
5. **Iteration 4**: Centralized Audit Logging & Correlation IDs
6. **Iteration 5**: Monitoring – Prometheus Metrics & `/metrics` Endpoint
7. **Iteration 6**: Prometheus & Grafana Config (Dashboards + Alerts)
8. **Iteration 7**: Alerts / Notifications, Failure Simulation & Crisis Management
9. **Iteration 8**: Final Verification & "How to Run" Guide

Each iteration has a clear role, mission, tasks, and style guidelines. Start with Iteration 0!

---

## 🎪 How to Use with Cursor AI

1. Open `docs/team4-iterations.md`
2. Copy the **entire prompt** for your current iteration
3. Paste it into Cursor AI chat
4. Ask: "Help me execute Iteration [N]" or "Let's start Iteration [N]"
5. Work through the tasks together
6. Verify tests pass before moving on

---

Happy Vibe Engineering! 🎨✨