# 🎯 Team 4 - Monitoring & Security: Iteration Master Plan

> **Vibe Engineering Edition** ✨  
> A systematic approach following best practices to build production-ready monitoring and security

---

## 🎪 Overview

This document contains **9 standalone iterations** (0-8) that will guide you through implementing Monitoring & Security for the **Coordinator service**. Each iteration builds on the previous one following **software engineering best practices**.

> **📌 Scope Note**: These iterations focus **exclusively on the Coordinator service**. Microservices monitoring and security will be handled in future iterations/loops. The Prometheus/Grafana setup will be designed to easily extend to microservices later, but current implementation focuses on Coordinator only.

### 🎯 Team 4 Final Deliverables (Hackathon Requirements)

By the end of all iterations, you must deliver (Coordinator-focused, extensible to microservices):

1. **Prometheus collects metrics from Coordinator** (designed to easily extend to microservices later)
2. **Grafana dashboards visualize:**
   - Requests/sec
   - Latency (p95)
   - Error rate
   - Uptime
   - Registrations of new services
   - Successful/failed data routing
3. **Security is enforced:**
   - Only authorized services can connect (JWT or mTLS - we use **JWT with RS256**)
   - Rate limiting and protection against SQL injection and prompt injection
   - Audit logs track key actions (service registration, routing, **schema changes**)
4. **Alerts/notifications trigger on:**
   - Service failure
   - Security violations

**Verification Criteria:**
- Grafana dashboard shows live metrics (≤10s refresh)
- Unauthorized connection attempts are blocked
- Security events are logged and generate alerts

### 📊 Deliverables Coverage Map

| Deliverable | Iteration(s) | Status |
|------------|--------------|--------|
| **Prometheus collects metrics** | Iteration 5, 6 | Metrics endpoint + Prometheus config |
| **Grafana dashboards (requests/sec, p95, error rate, uptime, registrations, routing)** | Iteration 6 | Dashboard JSON with all required panels |
| **JWT authentication (RS256)** | Iteration 2, 3 | Asymmetric JWT middleware + route protection |
| **Rate limiting** | Iteration 3 | Rate limiter middleware with different limits |
| **SQL injection protection** | Iteration 3 | Validation + parameterized queries |
| **Prompt injection protection** | Iteration 3 | LLM client with sanitization |
| **Audit logs (registration, routing, schema changes)** | Iteration 4 | Structured logging with correlation IDs |
| **Alerts on service failure** | Iteration 6, 7 | Prometheus alerts + Alertmanager config |
| **Alerts on security violations** | Iteration 6, 7 | Security-specific alert rules |

**Note:** We use **JWT with RS256** (asymmetric) instead of mTLS, as specified in the iterations. This is simpler to implement and maintain while providing strong security.

### 📋 Quick Status

Use this to track your progress:

- [ ] **Iteration 0**: Repo Recon & Test Harness
- [ ] **Iteration 1**: Config, Env Validation & Validation Library
- [ ] **Iteration 2**: Asymmetric JWT Security Core (RS256/ES256)
- [ ] **Iteration 3**: Attach JWT to Routes + Input Validation & Injection Protection
- [ ] **Iteration 4**: Centralized Audit Logging & Correlation IDs
- [ ] **Iteration 5**: Monitoring – Prometheus Metrics & `/metrics` Endpoint
- [ ] **Iteration 6**: Prometheus & Grafana Config (Dashboards + Alerts)
- [ ] **Iteration 7**: Alerts / Notifications, Failure Simulation & Crisis Management
- [ ] **Iteration 8**: Final Verification & "How to Run" Guide

---

## 🔍 Iteration 0: Repo Recon & Test Harness

### 🎭 Role
**AI Vibe Engineer + Senior Monitoring & Security Engineer**

### 🎯 Mission
Understand the repo structure and establish a working test harness so later iterations can follow best practices with proper testing.

### ✅ Tasks

1. **Scan the repo (no assumptions about paths):**
   * Identify:
     * The **Coordinator service** (Node/Express backend) directory
     * Any existing `/health`, `/register`, `/route`, `/metrics`, logging, or security-related code
   * **Note**: Do not focus on microservices at this stage - they will be handled in future iterations
   * Do **not** assume any specific path like `/backend` or `/coordinator` — infer from the actual project layout

2. **Document your findings (lightweight):**
   * Create a short markdown file, e.g. `docs/team4-initial-survey.md`, containing:
     * Coordinator folder path
     * Summary of existing monitoring/logging/security code in Coordinator
     * Any constraints that might affect Team 4's design (ports, frameworks, etc.)
     * Note: Microservices will be documented in future iterations

3. **Establish / confirm the test harness (best practices foundation):**
   * If no test framework exists:
     * Add a Node.js test setup (e.g. **Jest** + **supertest**)
     * Ensure:
       * `npm test` (or `pnpm test` / `yarn test`) runs all tests
       * The Express app is exported from a module (e.g. `app.js`) so tests can instantiate it without binding to a real port
   * If a test framework already exists:
     * Reuse it; do not introduce a second competing framework

4. **Add initial smoke tests (following best practices):**
   * Add a test file like `tests/health.test.js` that:
     * Sends a request to `/health` (or current health endpoint)
     * Asserts `200` status and a minimal expected response shape
     * Follows best practices: clear test names, isolated tests, proper assertions
   * If `/metrics` already exists, add a simple test asserting:
     * `/metrics` returns `200`
     * Response includes at least some Prometheus-looking text (e.g. `# HELP`)

5. **Keep changes minimal & passing:**
   * Ensure test suite passes at the end of this iteration
   * Do not yet implement JWT, metrics, or complex security; just set the stage

### 🎨 Style & Constraints

* Prefer small, well-named files and functions
* Add only the minimal dependencies required (e.g. Jest + supertest)
* Do not break existing endpoints used by other teams
* Clearly comment any new test setup files so other team members understand how to use them

---

## ⚙️ Iteration 1: Config, Env Validation & Validation Library

### 🎭 Role
**AI Vibe Engineer + Senior Monitoring & Security Engineer**

### 🎯 Mission
Add a **config module** and **validation library** so future iterations have a solid base.

### ✅ Tasks

1. **Config module with env validation (following best practices):**
   * Create a module, e.g. `src/config/index.js`, that:
     * Reads environment variables:
       * `SERVICE_JWT_PRIVATE_KEY` (issuer/dev script only)
       * `SERVICE_JWT_PUBLIC_KEY`
       * `SERVICE_JWT_ISSUER`
       * Optional `SERVICE_JWT_AUDIENCE`
       * Any monitoring-related ports or options (e.g. `METRICS_PORT` if separate)
     * Validates required values:
       * In non-test environments, missing critical values should cause a clear error
       * In test environments, allow overrides (e.g. by injecting dummy values)
   * **Best practices:**
     * Write comprehensive tests, e.g. `tests/config.test.js`:
       * When required env vars are missing → module throws a descriptive error
       * When env vars are present → module exposes a typed/config object with the correct values
     * Ensure tests are clear, isolated, and maintainable
     * Implement code following clean code principles

2. **Introduce a validation library:**
   * Choose one: `joi`, `zod`, or `express-validator` (prefer `zod` or `joi` for schemas)
   * Create a module like `src/validation/schemas.js` that defines (no wiring to routes yet):
     * `registerServiceSchema` for Coordinator's `/register`
       * Fields: service name, URL, schema reference, etc.
     * `routeRequestSchema` for `/route`
       * Fields: origin, requester, routing payload structure, etc.
   * **Best practices:**
     * Write comprehensive tests (e.g. `tests/validation.schemas.test.js`):
       * Valid payload → passes and returns parsed/validated object
       * Various invalid payloads (missing required fields, wrong types, invalid URLs) → fail with detailed error
     * Use clear test names that describe the scenario
     * Ensure tests are maintainable and easy to understand

3. **Provide simple usage helpers:**
   * Create small helpers, e.g.:
     * `validateRegisterService(payload)` → returns validated data or throws
     * `validateRouteRequest(payload)` → same pattern
   * Do not wire these into Express yet; that will be done in a later iteration

### 🎨 Style & Constraints

* Keep config and validation modules **framework-agnostic** where possible
* Follow **best practices**: Write tests alongside implementation, ensure good test coverage
* Keep error messages understandable for developers (include which field is invalid/missing)
* Do not change route behavior yet; this iteration prepares the core building blocks

---

## 🔐 Iteration 2: Asymmetric JWT Security Core (RS256/ES256)

### 🎭 Role
**AI Vibe Engineer + Security-Focused Backend Engineer**

### 🎯 Mission
Implement **asymmetric JWT** (RS256 or ES256) for service-to-service authentication following best practices.

### ✅ Tasks

1. **JWT verification middleware (Express):**
   * Create `src/security/authServiceJwtMiddleware.js` that:
     * Reads token from `Authorization: Bearer <token>` header
     * Uses `jsonwebtoken` with algorithms locked to RS256/ES256:
       ```js
       jwt.verify(token, publicKey, {
         algorithms: ['RS256'], // or ['ES256'] if configured
         issuer: config.serviceJwtIssuer,
         audience: config.serviceJwtAudience, // optional
       });
       ```
     * Validates claims:
       * `iss` must match expected issuer
       * `sub` or `service_id` must exist to identify calling service
       * Optionally validate `role` / `scope` for future RBAC
     * On success:
       * Attach decoded claims to `req.serviceContext`
       * Call `next()`
     * On failure:
       * Return `401` or `403` (decide and be consistent)
       * Log a security event (will be wired to logger in later iteration)
   * **Best practices - comprehensive testing (e.g. `tests/authServiceJwtMiddleware.test.js`):**
     * Missing `Authorization` header → 401
     * Malformed header (no "Bearer") → 401
     * Invalid token → 401
     * Token with wrong issuer/audience → 403 or 401
     * Valid RS256 token using the configured public key → request passes, `req.serviceContext` contains claims
     * Write tests for all edge cases and error scenarios
     * Ensure tests are isolated and can run independently

2. **Dev script for JWT generation (local testing):**
   * Create `scripts/generateServiceJwt.js` that:
     * Reads `SERVICE_JWT_PRIVATE_KEY`, `SERVICE_JWT_ISSUER`, optional `SERVICE_JWT_AUDIENCE`
     * Generates a JWT with:
       * `sub` or `service_id` (passed via CLI args or default)
       * Optional `role`/`scope`
       * Reasonable `exp` (e.g. 10–60 minutes)
     * Uses **RS256** or chosen asymmetric algorithm
     * Prints the token to stdout
   * **Best practices - comprehensive testing (unit/integration):**
     * Use a test RSA key pair in tests
     * Test that:
       * `generateServiceJwt` produces a token string
       * The resulting token is verifiable by the middleware when configured with the matching public key
     * Ensure test keys are separate from production keys
     * Cover edge cases like expired tokens, invalid claims, etc.

3. **Document JWT model:**
   * Add `docs/security-jwt.md` with:
     * Asymmetric model explanation
     * List of env vars (private vs public key, issuer, audience)
     * Clear statement:
       > "We use asymmetric JWT (e.g. RS256). Verifiers only use the public key; only the issuer holds the private key. No symmetric HS256 secrets."

### 🎨 Style & Constraints

* No hard-coded keys; everything via env vars
* No fallback to insecure algorithms
* JWT middleware must be composable and not tied to specific routes yet (routes will use it in later iterations)

---

## 🛡️ Iteration 3: Attach JWT to Routes + Input Validation & Injection Protection

### 🎭 Role
**AI Vibe Engineer + API Security Engineer**

### 🎯 Mission
Secure key Coordinator endpoints, add validation, and implement basic injection protection.

### ✅ Tasks

1. **Attach JWT auth middleware to protected routes:**
   * For Coordinator routes such as `/register`, `/route`, `/ui-settings`:
     * Use `authServiceJwtMiddleware` to require a valid JWT
   * Decide:
     * `/health` stays open
     * `/metrics` likely stays open for Prometheus (no sensitive data in metrics)
   * **Best practices - comprehensive testing (e.g. `tests/routes.auth.test.js`):**
     * Protected routes without token → 401/403
     * Protected routes with invalid token → 401/403
     * Protected routes with valid RS256 token → proceed (existing behavior remains)
     * Test all protected routes to ensure consistent behavior

2. **Input validation for `/register` and `/route`:**
   * Implement Express validation middleware using the schemas from Iteration 1:
     * `validateRegisterService`:
       * Enforces proper service name, URL, schema reference, etc.
     * `validateRouteRequest`:
       * Enforces structure for origin, requester, and payload
   * Wire them into the Coordinator routes:
     * Order for protected endpoints:
       1. JWT auth middleware
       2. Validation middleware
       3. Core handler logic
   * **Best practices - comprehensive testing (e.g. `tests/routes.validation.test.js`):**
     * Valid data + valid JWT → 200 (or route's normal behavior)
     * Invalid payload (missing required fields, wrong types, invalid URL) → 400 with structured errors
     * Ensure validation prevents obviously malicious strings from reaching DB/LLM
     * Test various edge cases and malformed inputs

3. **Basic SQL injection mitigation:**
   * Inspect Coordinator's DB calls:
     * Replace string-concatenated SQL (if any) with parameterized queries or ORM methods
   * Couple this with strict validation:
     * IDs, names, and other parameters must follow whitelisting patterns where possible
   * **Best practices - comprehensive testing:**
     * Write tests to ensure suspicious input (e.g. `"; DROP TABLE users;--`) is:
       * Rejected by validation (400), or
       * Safely handled without affecting SQL structure
     * Test various SQL injection patterns and ensure they're all blocked

4. **Rate limiting (REQUIRED DELIVERABLE):**
   * Implement rate limiting using `express-rate-limit`:
     * Create middleware `src/security/rateLimiter.js` with different limits:
       * **Strict rate limiter for `/register`** (e.g. 10 requests per 15 minutes per IP)
       * **Moderate rate limiter for `/route`** (e.g. 100 requests per minute per IP)
       * **General rate limiter** for other protected routes (e.g. 200 requests per minute per IP)
     * On rate limit exceeded:
       * Return `429 Too Many Requests` with clear message
       * Log as `security` event (will be wired to logger in Iteration 4)
     * Use IP-based or JWT-based identification (prefer JWT `serviceId` if available, fallback to IP)
   * Wire rate limiters to routes:
     * Order for protected endpoints:
       1. Rate limiting middleware
       2. JWT auth middleware
       3. Validation middleware
       4. Core handler logic
   * **Best practices - comprehensive testing (e.g. `tests/rateLimiter.test.js`):**
     * Requests within limit → proceed normally
     * Requests exceeding limit → 429 status
     * Rate limit resets after window expires
     * Different limits apply to different routes
     * Test concurrent requests and edge cases around limit boundaries

5. **Prompt injection protection for AI routing:**
   * If `/route` or related functions call an LLM:
     * Create `src/ai/llmClient.js` that:
       * Always prepends a strong system prompt instructing the model to ignore adversarial instructions
       * Truncates overly long user input
       * Optionally filters or flags obvious injection phrases (`"ignore previous instructions"`, etc.)
       * Logs prompts/responses with correlation IDs (sensitive content minimized)
   * **Best practices - comprehensive testing (e.g. `tests/ai.llmClient.test.js`):**
     * Ensure system prompt is always present
     * Long inputs are truncated
     * Known dangerous phrases are handled in a safe, predictable way
     * Test various injection patterns and edge cases
   * Add a short `docs/prompt-injection-notes.md` summarizing assumptions

### 🎨 Style & Constraints

* Never remove security to "make tests pass"; fix tests or behavior correctly
* Validation should be explicit and descriptive
* Keep route handlers thin: auth + validation + core logic + later metrics

---

## 📝 Iteration 4: Centralized Audit Logging & Correlation IDs

### 🎭 Role
**AI Vibe Engineer + Observability Engineer**

### 🎯 Mission
Implement structured logging, correlation IDs, and audit/security events.

### ✅ Tasks

1. **Central logger module:**
   * Create `src/logger.js` using **Winston** or **Pino**:
     * Emit structured JSON with fields:
       * `timestamp`
       * `level`
       * `service` (e.g. `"coordinator"`)
       * `route`
       * `correlationId`
       * `serviceId` (from JWT claims if available)
       * `message`
       * Extra metadata (e.g. error codes, reasons)
   * Define helper methods:
     * `info(meta, message)`
     * `warn(meta, message)`
     * `error(meta, message)`
     * `security(meta, message)` – for auth/attack attempts
     * `audit(meta, message)` – for important business/security actions (register, route)
   * **Best practices - comprehensive testing (e.g. `tests/logger.test.js`):**
     * Logger produces valid JSON with required fields
     * `security` and `audit` levels behave predictably (map to underlying logger level or dedicated tag)
     * Test that logs never leak sensitive information
     * Ensure correlation IDs are properly included

2. **Correlation ID middleware:**
   * Add middleware that:
     * Reads `X-Request-Id` from the request if present; otherwise generates a UUID
     * Attaches value to `req.correlationId`
     * Ensures logger calls include this ID
   * **Best practices - comprehensive testing (e.g. `tests/middleware.correlationId.test.js`):**
     * When header is absent → new ID created
     * When header is present → same value reused
     * Logged messages from a request include the correlationId
     * Test that correlation IDs are valid UUIDs

3. **Audit & security logging for critical flows (REQUIRED DELIVERABLES):**
   * Ensure the following events are logged:
     * **Service registrations**:
       * Success → `audit` log with serviceId, schema info, correlationId
       * Failure → `audit` and/or `error` with reason
     * **Schema changes** (REQUIRED DELIVERABLE):
       * When schemas are updated via `/register` or schema registry → `audit` log with:
         * Service ID
         * Old schema (summary or hash)
         * New schema (summary or hash)
         * Changed fields
         * correlationId
       * Schema validation failures → `audit` and/or `error` with reason
     * **Routing operations**:
       * Success/failure with relevant metadata
     * **Auth failures**:
       * Missing/invalid/expired token → `security` log with reason (but no sensitive token details)
       * Invalid signature → `security` log with details
       * Token expiration → `security` log with timestamp
     * **Rate-limit hits**:
       * When rate limit is exceeded → `security` log with:
         * IP address or serviceId
         * Route that was rate-limited
         * Rate limit window
         * correlationId
     * **Security violations** (REQUIRED DELIVERABLE):
       * Validation failures with suspicious patterns (e.g. potential SQL/prompt injection) → `security` log
       * Multiple auth failures from same IP/serviceId → `security` log with count
       * Any detected injection attempts → `security` log with pattern detected
   * **Best practices - comprehensive integration testing (e.g. `tests/auditLogging.test.js`):**
     * Trigger each scenario via HTTP tests and assert:
       * At least one log entry is produced
       * Log entry has the correct type (`security`/`audit`), correlationId, and key metadata
     * Test all critical flows to ensure proper logging coverage

4. **Documentation:**
   * Add `docs/logging.md` explaining:
     * Log format
     * Use of `correlationId`
     * Which actions are considered audit vs security events

### 🎨 Style & Constraints

* Logging must never leak secrets (JWTs, private keys, passwords)
* Keep logger dependency injected or importable cleanly so it can be mocked in tests
* Ensure logs are machine-readable (JSON) for future aggregation

---

## 📊 Iteration 5: Monitoring – Prometheus Metrics & `/metrics` Endpoint

### 🎭 Role
**AI Vibe Engineer + SRE-Oriented Backend Engineer**

### 🎯 Mission
Implement Prometheus metrics instrumentation and expose `/metrics` endpoint following best practices.

### ✅ Tasks

1. **Metrics module with prom-client:**
   * Create `coordinator/src/monitoring/metrics.js` that:
     * Uses `prom-client` and a shared registry
     * Defines metrics:
       * `http_requests_total{service, route, method, status}`
       * `http_request_duration_seconds{service, route, method}` (Histogram for p95 latency)
       * `http_errors_total{service, route, method, status}` or derive from `http_requests_total`
       * `process_start_time_seconds` (uptime)
       * `coordinator_service_registrations_total{status="success|failed"}`
       * `coordinator_routing_operations_total{status="success|failed"}`
     * Exports helpers:
       * `startTimer(route, method)` → returns `stopTimer(statusCode)`
       * `incrementError(route, method, statusCode)`
       * `incrementServiceRegistration(status)`
       * `incrementRoutingResult(status)`
   * **Best practices - comprehensive testing (e.g. `tests/metrics.unit.test.js`):**
     * When helpers are called, underlying counters/histograms are updated as expected
     * Ensure labels (service, route, method, status) are correctly set
     * Test metric registration and label combinations

2. **HTTP metrics middleware:**
   * Create `coordinator/src/monitoring/httpMetricsMiddleware.js`:
     * On request start:
       * Calls `startTimer(route, method)`
     * On response finish:
       * Calls `stopTimer(statusCode)` to observe latency
       * Increments request and error counters as needed
   * Wrap Coordinator routes with this middleware near the top of the stack (before handlers)
   * **Best practices - comprehensive testing (e.g. `tests/metrics.middleware.test.js`):**
     * Request to a test route triggers metrics updates
     * Differences between success (2xx) and errors (5xx) reflected in counters
     * Test that metrics are recorded correctly for all status codes

3. **`/metrics` endpoint:**
   * Create an Express route `/metrics` that:
     * Returns Prometheus text format from the shared registry
     * Uses `Content-Type: text/plain; version=0.0.4` (or as prom-client expects)
     * Generally keep `/metrics` unauthenticated (no secrets in metrics); this is what Prometheus scrapes
   * **Best practices - comprehensive testing (e.g. `tests/metrics.endpoint.test.js`):**
     * `/metrics` returns `200`
     * Body contains known metric names (e.g. `http_requests_total` and `process_start_time_seconds`)
     * Verify Prometheus text format is valid and parseable

4. **Documentation:**
   * Update README or `docs/monitoring-and-security.md`:
     * Coordinator port + `/metrics` path
     * Example Prometheus `scrape_configs` snippet

### 🎨 Style & Constraints

* No hard-coded ports for metrics; use config if needed
* Ensure using a single prom-client registry (not multiple conflicting ones)
* Do not mix business logic into metrics module; keep concerns separated

---

## 📈 Iteration 6: Prometheus & Grafana Config (Dashboards + Alerts)

### 🎭 Role
**AI Vibe Engineer + Monitoring Stack Designer**

### 🎯 Mission
Provide ready-to-use Prometheus & Grafana configuration artifacts.

### ✅ Tasks

1. **Monitoring infra folder:**
   * Create or extend `infra/monitoring/` with:
     * `prometheus.yml` – base scrape config
     * `alerts.yml` – Prometheus alerting rules
     * `grafana-dashboard-coordinator.json` – exportable Grafana dashboard

2. **Prometheus config:**
   * `prometheus.yml` should:
     * Define a job for the **Coordinator** that targets the `/metrics` endpoint
     * **Note**: Designed to easily add microservices later (comment placeholder sections for future microservice jobs)
     * Leave placeholders or comments explaining where Terraform/CI will inject hostnames/ports

3. **Grafana dashboard JSON (REQUIRED DELIVERABLES):**
   * `grafana-dashboard-coordinator.json` should contain panels for **all required metrics**:
     * **Requests/sec** (per route, per service) - REQUIRED
     * **p95 latency** per route - REQUIRED
     * **Error rate %** - REQUIRED
     * **Uptime** - REQUIRED
     * **New service registrations over time** - REQUIRED
     * **Successful vs failed data routing** - REQUIRED
   * **Additional recommended panels:**
     * Rate limit violations over time
     * Auth failure rate
     * Security events timeline
     * Schema change events
   * Organize panels logically (e.g. Overview row, Reliability row, Registration/Route row, Security row)
   * Ensure dashboard refreshes every **≤10s** (required for live monitoring)

4. **Prometheus alert rules (`alerts.yml`) (REQUIRED DELIVERABLES):**
   * Define rules covering both **service failure** and **security violations**:
     * **Service failure alerts:**
       * `HighErrorRate` – error rate > X% for Y minutes
       * `HighLatencyP95` – p95 latency > threshold
       * `CoordinatorDown` – `up{job="coordinator"} == 0` for 1–2 minutes
       * `RegistrationFailures` – spike in `coordinator_service_registrations_total{status="failed"}`
       * `RoutingFailures` – spike in `coordinator_routing_operations_total{status="failed"}`
     * **Security violation alerts (REQUIRED DELIVERABLE):**
       * `HighAuthFailureRate` – spike in auth failures (e.g. >10 failures per minute)
       * `RateLimitExceeded` – sustained rate limit violations (e.g. >5 violations per minute)
       * `SuspiciousActivity` – multiple security events from same IP/serviceId
       * `InjectionAttempts` – detection of SQL/prompt injection patterns (via log metrics or direct metric)
     * Add labels to all alerts:
       * `severity: "warning"` or `"critical"`
       * `team: "team4"`
       * `component: "coordinator"` or `"monitoring"`
     * Add annotations with human-friendly descriptions and runbook hints
     * Add comments for suggested thresholds and how to tune them

5. **Lightweight validation:**
   * Add a small test (e.g. `tests/monitoring.config.test.js`) that:
     * Loads the YAML files (using a YAML parser)
     * Asserts they parse successfully and contain expected structural keys

### 🎨 Style & Constraints

* Avoid hard-coding hostnames; use placeholders or simple defaults with comments
* Keep Grafana dashboard reasonably simple and focused on SLO-style metrics
* Explain how to import the dashboard in Grafana in comments or docs

---

## 🚨 Iteration 7: Alerts / Notifications, Failure Simulation & Crisis Management

### 🎭 Role
**AI Vibe Engineer + Incident-Response-Friendly SRE**

### 🎯 Mission
Make alerts actionable, document how to simulate failures, and establish crisis management procedures.

### ✅ Tasks

1. **Alert labels & severities:**
   * In `alerts.yml`, add labels for each alert rule:
     * Example: `severity: "warning"` or `"critical"`
     * Add annotations with human-friendly descriptions and runbook hints

2. **Alertmanager example config (optional but recommended):**
   * Add `infra/monitoring/alertmanager.example.yml` with:
     * Example route configuration
     * Example receiver for email / Slack / webhook
   * Make it clear this is an example; actual credentials/URLs are not committed

3. **Document failure simulation & alert verification (REQUIRED DELIVERABLES):**
   * In `docs/monitoring-and-security.md`, add a section covering **both service failures and security violations**:
     * **Service failure simulation:**
       * **CoordinatorDown**: Stop Coordinator → Prometheus should flag it
       * **HighErrorRate**: Hit a route that returns 500 repeatedly
       * **HighLatencyP95**: Simulate delayed responses in a test route
       * **RegistrationFailures**: Purposely send invalid `/register` requests that fail validation
       * **RoutingFailures**: Trigger failed `/route` calls
     * **Security violation simulation (REQUIRED):**
       * **Unauthorized connection attempts**: Send requests without JWT or with invalid JWT → should be blocked and logged
       * **Rate limit violations**: Send excessive requests to `/register` → should trigger rate limit and security alert
       * **SQL injection attempts**: Send malicious SQL in payloads → should be blocked by validation and logged
       * **Prompt injection attempts**: Send prompt injection patterns to `/route` → should be sanitized and logged
     * **How to verify:**
       * View fired alerts in Prometheus UI or Grafana
       * Confirm that alert labels & descriptions make sense
       * Confirm security events appear in audit/security logs
       * Confirm Grafana dashboard shows ≤10s refresh with live metrics

4. **Crisis management procedures (REQUIRED DELIVERABLE):**
   * Create `docs/crisis-management.md` with:
     * **Incident response procedures:**
       * When to declare an incident (based on alert severities)
       * Escalation procedures (who to notify, when to escalate)
       * Communication plan (team Slack/channels, stakeholders)
     * **Runbooks for common incidents:**
       * **CoordinatorDown**: Steps to diagnose, restart, check logs, verify health
       * **HighErrorRate**: Steps to identify failing routes, check logs, trace errors, potential rollback
       * **HighLatencyP95**: Steps to identify slow routes, check database/LLM calls, scaling considerations
       * **Security Violations**: Steps to investigate, block IPs/services, review audit logs, notify security team
       * **Rate Limit Abuse**: Steps to verify legitimate vs malicious traffic, adjust limits, block attackers
       * **Schema Change Failures**: Steps to verify schema validity, rollback if needed, fix validation
     * **Rollback procedures:**
       * How to quickly rollback Coordinator to previous version
       * How to rollback configuration changes
       * How to disable new features if causing issues
     * **Post-incident review:**
       * Template for post-mortem documentation
       * What to capture (timeline, root cause, actions taken, lessons learned)
     * **Monitoring during incidents:**
       * Which dashboards to watch (Grafana panels)
       * Key metrics to monitor (error rate, latency, request volume)
       * Log queries to run (correlation IDs, error patterns)

5. **(Optional) Testing / linting:**
   * Add a basic test or script that:
     * Parses `alerts.yml` to ensure it's syntactically valid
     * Or a CI job that validates YAML as part of the pipeline

### 🎨 Style & Constraints

* Do not include any real secrets or external URLs in Alertmanager example
* Focus on making it easy for hackathon judges and teammates to actually **see** alerts firing
* Crisis management docs should be concise but actionable - someone should be able to follow them during an actual incident

---

## ✅ Iteration 8: Final Verification & "How to Run" Guide

### 🎭 Role
**AI Vibe Engineer + Documentation-Focused Lead**

### 🎯 Mission
End-to-end verification + clear "How to Run & Verify" documentation.

### ✅ Tasks

1. **End-to-end checks (manually + via tests where possible) - ALL REQUIRED DELIVERABLES:**
   * **Security verification:**
     * JWT-protected endpoints reject unauthenticated requests → 401/403
     * Valid RS256 JWT from `scripts/generateServiceJwt.js` is accepted → 200
     * Invalid/expired tokens are rejected → 401/403
     * Rate limiting blocks excessive requests → 429
     * SQL injection attempts are blocked by validation → 400
     * Prompt injection attempts are sanitized → processed safely
   * **Monitoring verification:**
     * Metrics reflect actual traffic and errors
     * Prometheus collects metrics from Coordinator (`/metrics` endpoint working correctly)
     * Grafana dashboard shows live metrics (≤10s refresh)
     * All required metrics are visible: requests/sec, p95 latency, error rate, uptime, registrations, routing success/fails
     * **Note**: Microservices monitoring will be verified in future iterations
   * **Audit logging verification:**
     * Audit & security logs appear in structured JSON with correlation IDs
     * Service registrations are logged
     * Routing operations are logged
     * Schema changes are logged (REQUIRED)
     * Security violations are logged
   * **Alert verification:**
     * Prometheus alerts fire under simulated service failure conditions
     * Prometheus alerts fire under simulated security violation conditions
     * Alert notifications are configured and testable

2. **Create / update `docs/monitoring-and-security.md`:**
   Include:
   1. **Overview:**
      * Short description of what Team 4 implemented: Monitoring, Security (asymmetric JWT), Logging, Alerts
   2. **Setup & env vars:**
      * Required env vars:
        * `SERVICE_JWT_PRIVATE_KEY` (issuer only)
        * `SERVICE_JWT_PUBLIC_KEY` (for Coordinator JWT verification)
        * `SERVICE_JWT_ISSUER`, `SERVICE_JWT_AUDIENCE` (if used)
      * Any metrics-specific config (ports, etc.)
      * **Note**: Microservices will use the same public key - configuration will be documented for future iterations
   3. **Running locally:**
      * Start Coordinator service
      * Start Prometheus & Grafana (docker-compose or Railway)
      * Import Grafana dashboard JSON
      * **Note**: Microservices will be added to monitoring stack in future iterations
   4. **Testing JWT security:**
      * How to run `scripts/generateServiceJwt.js` to get a valid token
      * Example `curl` commands:
        * Without token → 401/403
        * With valid token → 200
        * With invalid/expired token → 401/403
   5. **Observability checks:**
      * How to hit endpoints to generate traffic
      * Where to see metrics in Grafana
      * What each panel represents (requests/sec, p95 latency, error rate, uptime, registrations, routing success/fails)
   6. **Alerts & failure simulation:**
      * Step-by-step to simulate Coordinator down, high error rate, high latency, failed registrations/routing
      * How to see alerts in Prometheus/Grafana
      * What to do when you see each type of alert (brief runbook-style bullet list)
   7. **Testing and quality assurance:**
      * Mention that:
        * JWT, validation, metrics, logging, and configs are all covered by comprehensive tests
        * `npm test` should be run on every change
        * Following best practices ensures maintainable, reliable code

3. **Final polish:**
   * Ensure `npm test` (or equivalent) passes cleanly
   * Ensure no secrets or keys are committed
   * Make the docs and filenames intuitive for hackathon judges and teammates

### 🎨 Style & Constraints

* Docs should be concise but complete enough for someone new to the repo to run and verify Team 4's work
* Keep command examples copy-paste friendly

---

## 🎓 Best Practices (Reminder)

All iterations follow **software engineering best practices**:

1. **Write comprehensive tests**: Ensure good test coverage for all critical functionality
2. **Test alongside implementation**: Write tests as you implement, ensuring code is testable
3. **Keep tests maintainable**: Use clear test names, isolated tests, and proper assertions
4. **Follow clean code principles**: Write readable, maintainable code with clear naming and structure
5. **Document decisions**: Comment complex logic and document architectural decisions

Never skip tests. Never remove tests to make code "work". Fix the code, not the tests. Good test coverage is essential for production-ready code.

---

## 🚀 Quick Start Guide

1. Start with **Iteration 0** - understand the repo
2. Complete iterations sequentially (0 → 1 → 2 → ... → 8)
3. After each iteration:
   - Run `npm test` and ensure all tests pass
   - Check off the iteration in your progress tracker
   - Commit your changes
4. Use the orchestrator script (see `docs/team4-orchestrator.md`) for guided execution

---

**Happy Vibe Engineering! 🎨✨**

