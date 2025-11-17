# 🎯 Team 4 Deliverables Mapping

This document maps the **Hackathon Final Deliverables** to specific **Iterations** to ensure 100% coverage.

---

## 📋 Hackathon Requirements → Iterations Mapping

### ✅ 1. Prometheus collects metrics from Coordinator

**Covered in:**
- **Iteration 5**: Monitoring – Prometheus Metrics & `/metrics` Endpoint
  - Creates `/metrics` endpoint on Coordinator using `prom-client`
  - Exposes metrics in Prometheus text format
  - Tracks: requests, latency, errors, uptime, registrations, routing operations

- **Iteration 6**: Prometheus & Grafana Config
  - Creates `prometheus.yml` with scrape configuration for Coordinator
  - **Note**: Designed to easily extend to microservices later (placeholder comments included)

> **📌 Scope Note**: Current iterations focus on Coordinator only. Microservices metrics collection will be added in future iterations.

---

### ✅ 2. Grafana dashboards visualize:

#### 📊 Requests/sec
**Covered in Iteration 6:**
- Grafana dashboard panel: `http_requests_total` metric
- Per route and per service breakdown

#### ⏱️ Latency (p95)
**Covered in Iteration 6:**
- Grafana dashboard panel: `http_request_duration_seconds` histogram
- Calculates p95 percentile per route

#### ❌ Error rate
**Covered in Iteration 6:**
- Grafana dashboard panel: Derived from `http_requests_total` with `status >= 500`
- Shows percentage error rate over time

#### ⏰ Uptime
**Covered in Iteration 6:**
- Grafana dashboard panel: `process_start_time_seconds` metric
- Calculates uptime duration

#### 📝 Registrations of new services
**Covered in Iteration 6:**
- Grafana dashboard panel: `coordinator_service_registrations_total{status="success|failed"}` counter
- Shows registrations over time

#### 🔄 Successful/failed data routing
**Covered in Iteration 6:**
- Grafana dashboard panel: `coordinator_routing_operations_total{status="success|failed"}` counter
- Shows routing success vs failure rates

**All metrics must refresh ≤10s** (specified in Iteration 6 requirements)

---

### ✅ 3. Security is enforced:

#### 🔐 Only authorized services can connect (JWT with RS256)
**Covered in:**
- **Iteration 2**: Asymmetric JWT Security Core (RS256/ES256)
  - Creates JWT verification middleware
  - Uses asymmetric RS256 algorithm (public key for verification)
  - Validates issuer, audience, and claims

- **Iteration 3**: Attach JWT to Routes
  - Wires JWT middleware to protected routes (`/register`, `/route`, `/ui-settings`)
  - Rejects unauthorized requests with 401/403

**Note:** We use **JWT with RS256** (asymmetric) instead of mTLS for simplicity and security.

#### 🚦 Rate limiting
**Covered in Iteration 3:**
- Creates rate limiting middleware using `express-rate-limit`
- Different limits per route:
  - `/register`: Strict (e.g. 10/15min)
  - `/route`: Moderate (e.g. 100/min)
  - Other routes: General (e.g. 200/min)
- Returns 429 when exceeded
- Logged as security event

#### 🛡️ Protection against SQL injection
**Covered in Iteration 3:**
- Input validation using schemas (from Iteration 1)
- Parameterized queries or ORM methods (no string concatenation)
- Whitelisting patterns for IDs, names, etc.
- Suspicious input rejected by validation (400) or safely handled

#### 🧠 Protection against prompt injection
**Covered in Iteration 3:**
- Creates `src/ai/llmClient.js` for AI routing
- Always prepends strong system prompt
- Truncates overly long inputs
- Filters obvious injection phrases
- Logs prompts/responses with correlation IDs

---

### ✅ 4. Audit logs track key actions:

#### 📝 Service registration
**Covered in Iteration 4:**
- Success: `audit` log with serviceId, schema info, correlationId
- Failure: `audit` and/or `error` with reason
- Structured JSON format with all required fields

#### 🔄 Routing operations
**Covered in Iteration 4:**
- Success/failure logged with relevant metadata
- Includes correlationId for traceability
- Structured JSON format

#### 📋 Schema changes
**Covered in Iteration 4:**
- When schemas updated via `/register` → `audit` log with:
  - Service ID
  - Old schema (summary or hash)
  - New schema (summary or hash)
  - Changed fields
  - correlationId
- Schema validation failures logged

**All audit logs:**
- Structured JSON format
- Include correlation IDs
- Never leak secrets (JWTs, keys, passwords)
- Machine-readable for aggregation

---

### ✅ 5. Alerts/notifications trigger on:

#### 🔴 Service failure
**Covered in Iteration 6 & 7:**
- **Iteration 6**: Prometheus alert rules (`alerts.yml`)
  - `HighErrorRate` – error rate > X% for Y minutes
  - `HighLatencyP95` – p95 latency > threshold
  - `CoordinatorDown` – service down for 1–2 minutes
  - `RegistrationFailures` – spike in failed registrations
  - `RoutingFailures` – spike in failed routing operations

- **Iteration 7**: Alert labels, severities, and Alertmanager config
  - Labels: `severity`, `team`, `component`
  - Annotations with human-friendly descriptions
  - Example Alertmanager config for notifications

#### 🚨 Security violations
**Covered in Iteration 6 & 7:**
- **Iteration 6**: Security-specific Prometheus alert rules
  - `HighAuthFailureRate` – spike in auth failures
  - `RateLimitExceeded` – sustained rate limit violations
  - `SuspiciousActivity` – multiple security events from same IP/serviceId
  - `InjectionAttempts` – detection of SQL/prompt injection patterns

- **Iteration 7**: Security violation simulation guide
  - How to simulate unauthorized connection attempts
  - How to simulate rate limit violations
  - How to simulate injection attempts
  - How to verify alerts fire

---

## 🎯 Verification Criteria Coverage

### ✅ Grafana dashboard shows live metrics (≤10s refresh)
**Covered in Iteration 6:**
- Dashboard configured with ≤10s refresh rate
- All required panels visible and updating

### ✅ Unauthorized connection attempts are blocked
**Covered in Iteration 3 & 8:**
- JWT middleware rejects requests without valid token → 401/403
- Verified in end-to-end tests (Iteration 8)

### ✅ Security events are logged and generate alerts
**Covered in Iteration 4, 6, 7 & 8:**
- Security events logged in Iteration 4 (auth failures, rate limits, injection attempts)
- Alerts configured in Iteration 6 (security violation alert rules)
- Alert verification in Iteration 7 & 8

---

## 📊 Complete Coverage Summary

| Requirement | Iterations | Status |
|------------|------------|--------|
| Prometheus metrics collection | 5, 6 | ✅ Fully covered |
| Grafana dashboards (all 6 metrics) | 6 | ✅ Fully covered |
| JWT authentication (RS256) | 2, 3 | ✅ Fully covered |
| Rate limiting | 3 | ✅ Fully covered |
| SQL injection protection | 3 | ✅ Fully covered |
| Prompt injection protection | 3 | ✅ Fully covered |
| Audit logs (registration) | 4 | ✅ Fully covered |
| Audit logs (routing) | 4 | ✅ Fully covered |
| Audit logs (schema changes) | 4 | ✅ Fully covered |
| Alerts on service failure | 6, 7 | ✅ Fully covered |
| Alerts on security violations | 6, 7 | ✅ Fully covered |
| Verification criteria | 8 | ✅ Fully covered |

---

## 🚀 Implementation Order

1. **Iteration 0**: Set up foundation (test harness)
2. **Iteration 1**: Config and validation foundation
3. **Iteration 2**: JWT security core
4. **Iteration 3**: Route protection, rate limiting, injection protection
5. **Iteration 4**: Audit logging (registration, routing, schema changes)
6. **Iteration 5**: Prometheus metrics endpoint
7. **Iteration 6**: Grafana dashboards + Prometheus alerts
8. **Iteration 7**: Alert notifications + simulation guide
9. **Iteration 8**: Final verification + documentation

**All deliverables are covered across these 9 iterations!** ✨

---

## 📝 Notes

- **JWT vs mTLS**: We use JWT with RS256 (asymmetric) instead of mTLS. This provides strong security while being simpler to implement and maintain.

- **Rate limiting**: Implemented in Iteration 3 as a required deliverable, not optional.

- **Schema changes**: Explicitly logged in Iteration 4 as a required deliverable (not just mentioned).

- **Security violations**: Both logged (Iteration 4) and alertable (Iteration 6, 7) to meet full requirements.

- **≤10s refresh**: Explicitly specified in Iteration 6 for Grafana dashboard to meet verification criteria.

