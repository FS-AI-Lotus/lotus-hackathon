# 🎪 Team 4 Orchestrator - Vibe Engineering Edition

> Your friendly guide to systematically building Monitoring & Security, one vibe at a time ✨

---

## 🎯 What is This?

This orchestrator helps you execute **9 iterations** (0-8) to build production-ready Monitoring & Security for the **Coordinator service**. Each iteration builds on the previous one following **software engineering best practices**.

> **📌 Scope Note**: These iterations focus **exclusively on the Coordinator service**. Microservices will be handled in future iterations/loops. The architecture is designed to easily extend to microservices later.

Think of it as your **AI pair programmer** that keeps you on track, maintains good vibes, and ensures you don't skip important steps.

---

## 🚀 Quick Start

1. **Review the master plan**: Open `docs/team4-iterations.md` and read through all iterations
2. **Track your progress**: Use the checkboxes in the master plan or the progress tracker below
3. **Execute one iteration at a time**: Don't jump ahead! Each iteration sets up the foundation for the next
4. **Run tests after each iteration**: `npm test` should pass before moving on

---

## 📋 Progress Tracker

Copy this into your notes or commit it as `PROGRESS.md`:

```markdown
# Team 4 - Progress Tracker

## Iteration Status

- [ ] **Iteration 0**: Repo Recon & Test Harness
  - [ ] Scanned repo structure
  - [ ] Created initial survey doc
  - [ ] Set up test framework (Jest/supertest)
  - [ ] Added smoke tests
  - [ ] All tests passing

- [ ] **Iteration 1**: Config, Env Validation & Validation Library
  - [ ] Config module with env validation
  - [ ] Tests for config module
  - [ ] Validation library (zod/joi)
  - [ ] Validation schemas for /register and /route
  - [ ] Tests for validation
  - [ ] All tests passing

- [ ] **Iteration 2**: Asymmetric JWT Security Core (RS256/ES256)
  - [ ] JWT verification middleware
  - [ ] Tests for JWT middleware
  - [ ] Dev script for JWT generation
  - [ ] Tests for JWT generation
  - [ ] JWT documentation
  - [ ] All tests passing

- [ ] **Iteration 3**: Attach JWT to Routes + Input Validation & Injection Protection
  - [ ] JWT middleware attached to protected routes
  - [ ] Tests for route auth
  - [ ] Input validation wired to routes
  - [ ] Tests for route validation
  - [ ] SQL injection mitigation
  - [ ] Prompt injection protection (if needed)
  - [ ] All tests passing

- [ ] **Iteration 4**: Centralized Audit Logging & Correlation IDs
  - [ ] Central logger module (Winston/Pino)
  - [ ] Tests for logger
  - [ ] Correlation ID middleware
  - [ ] Tests for correlation ID middleware
  - [ ] Audit & security logging for critical flows
  - [ ] Tests for audit logging
  - [ ] Logging documentation
  - [ ] All tests passing

- [ ] **Iteration 5**: Monitoring – Prometheus Metrics & `/metrics` Endpoint
  - [ ] Metrics module with prom-client
  - [ ] Tests for metrics module
  - [ ] HTTP metrics middleware
  - [ ] Tests for metrics middleware
  - [ ] /metrics endpoint
  - [ ] Tests for /metrics endpoint
  - [ ] Documentation updated
  - [ ] All tests passing

- [ ] **Iteration 6**: Prometheus & Grafana Config (Dashboards + Alerts)
  - [ ] Created infra/monitoring/ folder
  - [ ] Prometheus config (prometheus.yml)
  - [ ] Grafana dashboard JSON
  - [ ] Prometheus alert rules (alerts.yml)
  - [ ] Config validation tests
  - [ ] All tests passing

- [ ] **Iteration 7**: Alerts / Notifications, Failure Simulation & Crisis Management
  - [ ] Alert labels & severities added
  - [ ] Alertmanager example config (optional)
  - [ ] Failure simulation documentation
  - [ ] Alert verification guide
  - [ ] Crisis management procedures document
  - [ ] Runbooks for common incidents
  - [ ] Rollback procedures
  - [ ] Post-incident review template
  - [ ] Config validation tests (if added)
  - [ ] All tests passing

- [ ] **Iteration 8**: Final Verification & "How to Run" Guide
  - [ ] End-to-end checks completed
  - [ ] Monitoring & security documentation created/updated
  - [ ] All tests passing
  - [ ] No secrets committed
  - [ ] Ready for demo!

## Notes

* Started: [DATE]
* Current Iteration: [NUMBER]
* Blockers: [ANY ISSUES]
```

---

## 🎨 Vibe Engineering Principles

### 1. **One Iteration at a Time** 🎯
   - Complete iteration 0 before starting iteration 1
   - Don't skip ahead - each iteration sets up dependencies for the next
   - If stuck, review the iteration's mission and tasks

### 2. **Best Practices & Testing** 🧪
   - Write comprehensive tests alongside implementation
   - Ensure good test coverage for all critical functionality
   - Test edge cases and error scenarios
   - Keep tests maintainable and well-organized
   - Never skip tests to "make things work faster"

### 3. **Commit Frequently** 💾
   - Commit after completing each major task within an iteration
   - Write clear commit messages: "Iteration 0: Add Jest test framework"
   - This makes it easy to roll back if something breaks

### 4. **Ask for Help** 🤝
   - If you're stuck on a specific iteration, review:
     - The iteration's role and mission
     - The tasks checklist
     - The style & constraints section
   - Don't hack around problems - fix them properly

### 5. **Keep It Clean** ✨
   - Small, well-named files and functions
   - Clear comments where needed
   - Don't break existing endpoints used by other teams
   - Follow the style & constraints for each iteration

---

## 🔧 How to Use This Orchestrator

### Option 1: Manual Execution (Recommended for Learning)

1. Open `docs/team4-iterations.md`
2. Navigate to the current iteration (start with Iteration 0)
3. Read the role, mission, and tasks
4. Execute tasks one by one
5. Run `npm test` frequently
6. Check off tasks as you complete them
7. Move to next iteration only when current one is complete

### Option 2: AI-Assisted Execution (Using Cursor AI)

1. Copy the **entire prompt** for your current iteration from `docs/team4-iterations.md`
2. Paste it into Cursor AI chat
3. Ask: "Help me execute Iteration [N]" or "Let's start Iteration [N]"
4. Work through the tasks together
5. Verify tests pass before moving on

### Option 3: Scripted Progress Tracker

You can use the provided `scripts/progress-tracker.js` (if created) to:
- Track which iterations are complete
- List remaining tasks
- Generate progress reports

---

## 🎯 Iteration Execution Template

For each iteration, follow this pattern:

```markdown
## Iteration [N]: [NAME]

### 1. Understand the Mission
- [ ] Read the role description
- [ ] Read the mission statement
- [ ] Understand how this builds on previous iterations

### 2. Review Tasks
- [ ] List all tasks for this iteration
- [ ] Identify any dependencies (e.g., requires Iteration 1's config module)

### 3. Execute Tasks (Following Best Practices)
- [ ] Review requirements and design approach
- [ ] Write tests alongside implementation
- [ ] Run tests frequently to catch issues early
- [ ] Implement functionality incrementally
- [ ] Refactor as needed while keeping tests passing
- [ ] Ensure good test coverage for critical paths

### 4. Verify Completion
- [ ] All tasks completed
- [ ] All tests passing (`npm test`)
- [ ] Documentation updated (if required)
- [ ] No breaking changes to existing functionality
- [ ] Ready to move to next iteration
```

---

## 🚨 Common Pitfalls & How to Avoid Them

### ❌ Pitfall 1: Skipping Tests
**Problem**: "Tests take too long, I'll add them later"
**Solution**: Tests are essential for reliability. Write tests alongside implementation, ensuring good coverage for critical functionality.

### ❌ Pitfall 2: Jumping Ahead
**Problem**: "I know Iteration 2 is JWT, let me start that"
**Solution**: Each iteration depends on previous ones. Iteration 2 needs Iteration 1's config module. Don't skip.

### ❌ Pitfall 3: Breaking Existing Code
**Problem**: "My middleware broke the /health endpoint"
**Solution**: Test existing endpoints after adding new middleware. Ensure `/health` still works.

### ❌ Pitfall 4: Hard-coding Values
**Problem**: "I'll just hard-code the JWT key for now"
**Solution**: Use environment variables and config modules. Hard-coded values break in production.

### ❌ Pitfall 5: Mixing Concerns
**Problem**: "I'll add metrics and logging in the same middleware"
**Solution**: Keep modules focused. Separate middleware for metrics, logging, auth, validation.

---

## 📚 Resources

### Key Files to Create

- `docs/team4-initial-survey.md` (Iteration 0)
- `src/config/index.js` (Iteration 1)
- `src/validation/schemas.js` (Iteration 1)
- `src/security/authServiceJwtMiddleware.js` (Iteration 2)
- `scripts/generateServiceJwt.js` (Iteration 2)
- `docs/security-jwt.md` (Iteration 2)
- `src/ai/llmClient.js` (Iteration 3, if needed)
- `src/logger.js` (Iteration 4)
- `docs/logging.md` (Iteration 4)
- `src/monitoring/metrics.js` (Iteration 5)
- `src/monitoring/httpMetricsMiddleware.js` (Iteration 5)
- `infra/monitoring/prometheus.yml` (Iteration 6)
- `infra/monitoring/alerts.yml` (Iteration 6)
- `infra/monitoring/grafana-dashboard-coordinator.json` (Iteration 6)
- `infra/monitoring/alertmanager.example.yml` (Iteration 7, optional)
- `docs/monitoring-and-security.md` (Iteration 8)

### Testing Structure

```
tests/
  ├── config.test.js
  ├── validation.schemas.test.js
  ├── authServiceJwtMiddleware.test.js
  ├── routes.auth.test.js
  ├── routes.validation.test.js
  ├── logger.test.js
  ├── middleware.correlationId.test.js
  ├── auditLogging.test.js
  ├── metrics.unit.test.js
  ├── metrics.middleware.test.js
  ├── metrics.endpoint.test.js
  └── monitoring.config.test.js
```

---

## 🎉 Success Criteria

You'll know you're done when:

1. ✅ All 9 iterations are complete and checked off
2. ✅ `npm test` passes with 100% of tests green
3. ✅ Coordinator has `/metrics` endpoint exposing Prometheus format
4. ✅ Grafana dashboard shows live metrics
5. ✅ JWT-protected routes reject unauthenticated requests
6. ✅ Valid RS256 JWT is accepted on protected routes
7. ✅ Audit and security logs appear in structured JSON
8. ✅ Prometheus alerts fire under simulated failures
9. ✅ Documentation is complete and clear
10. ✅ No secrets or keys are committed to the repo

---

## 💬 Need Help?

If you're stuck:

1. **Review the iteration's tasks** - Are you missing something?
2. **Check the style & constraints** - Are you following the guidelines?
3. **Look at tests** - Do they clearly show what's expected?
4. **Read previous iterations** - Do you have the required dependencies?

Remember: **Vibe Engineering** is about systematic, thoughtful progress. Take it one step at a time, test as you go, and keep the vibes positive! ✨

---

**Happy Iterating! 🚀**

