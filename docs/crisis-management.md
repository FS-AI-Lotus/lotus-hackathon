# Crisis Management Procedures

This document provides incident response procedures, runbooks, and crisis management guidelines for the Coordinator service.

## 📋 Table of Contents

1. [Incident Response Procedures](#incident-response-procedures)
2. [Runbooks for Common Incidents](#runbooks-for-common-incidents)
3. [Rollback Procedures](#rollback-procedures)
4. [Post-Incident Review](#post-incident-review)
5. [Monitoring During Incidents](#monitoring-during-incidents)

---

## Incident Response Procedures

### When to Declare an Incident

Declare an incident when:

- **Critical alerts are firing** (severity: `critical`)
  - CoordinatorDown
  - HighErrorRateCritical
  - HighLatencyP95Critical
  - Critical security violations

- **Service is unavailable** or severely degraded
- **Data loss or corruption** is suspected
- **Security breach** is detected
- **Multiple warning alerts** persist for >15 minutes

### Severity Levels

| Severity | Response Time | Escalation |
|----------|---------------|------------|
| **Critical** | Immediate (< 5 min) | On-call engineer + Team lead |
| **Warning** | Within 15 minutes | On-call engineer |
| **Info** | Monitor and document | No escalation |

### Escalation Procedures

1. **Initial Response (0-5 minutes)**
   - On-call engineer acknowledges alert
   - Assess severity and impact
   - Start incident response

2. **If No Response (5-15 minutes)**
   - Escalate to backup on-call
   - Notify team lead

3. **If Still Unresolved (15-30 minutes)**
   - Escalate to engineering manager
   - Consider involving additional team members
   - Update stakeholders

4. **Critical Incidents (>30 minutes)**
   - Escalate to CTO/VP Engineering
   - Prepare communication for customers/stakeholders
   - Consider external support if needed

### Communication Plan

**Internal Channels:**
- **Slack**: `#team4-incidents` (critical), `#team4-alerts` (warnings)
- **Email**: `team4-oncall@example.com`
- **PagerDuty/OpsGenie**: For critical alerts (if configured)

**Stakeholder Updates:**
- Update every 15 minutes during active incident
- Include: Status, impact, ETA, actions taken
- Use clear, non-technical language for business stakeholders

**Post-Incident:**
- Send summary within 24 hours
- Schedule post-mortem within 48 hours

---

## Runbooks for Common Incidents

### CoordinatorDown

**Alert**: `CoordinatorDown` (severity: critical)

**Symptoms:**
- Coordinator service not responding
- Health checks failing
- All requests timing out
- Prometheus target shows "DOWN"

**Diagnosis Steps:**

1. **Check if service is running:**
   ```bash
   # Check process
   ps aux | grep "node.*test-server"
   # or
   Get-Process -Name node
   
   # Check if port is listening
   netstat -an | grep 3000
   # or
   Test-NetConnection -ComputerName localhost -Port 3000
   ```

2. **Check service logs:**
   ```bash
   # If running as service, check logs
   journalctl -u coordinator -n 100
   # or check application logs
   tail -f /var/log/coordinator/error.log
   ```

3. **Check system resources:**
   ```bash
   # CPU and memory
   top
   # or
   htop
   ```

4. **Check network connectivity:**
   ```bash
   # Test connectivity
   curl http://localhost:3000/health
   ping coordinator-host
   ```

**Resolution Steps:**

1. **If service crashed:**
   ```bash
   # Restart service
   systemctl restart coordinator
   # or
   node test-server.js
   ```

2. **If out of memory:**
   - Check memory usage
   - Restart service
   - Consider increasing memory limits
   - Check for memory leaks

3. **If port conflict:**
   ```bash
   # Find process using port 3000
   lsof -i :3000
   # or
   netstat -ano | findstr :3000
   
   # Kill conflicting process or change Coordinator port
   ```

4. **If deployment issue:**
   - Check deployment logs
   - Verify configuration
   - Rollback to previous version if needed

5. **Verify recovery:**
   ```bash
   # Check health endpoint
   curl http://localhost:3000/health
   
   # Check Prometheus target
   # Open http://localhost:9090/targets
   # Should show "UP"
   ```

**Prevention:**
- Set up health check monitoring
- Configure automatic restarts
- Monitor resource usage
- Set up alerts for resource exhaustion

---

### HighErrorRate

**Alert**: `HighErrorRate` (severity: warning) or `HighErrorRateCritical` (severity: critical)

**Symptoms:**
- High percentage of 5xx errors
- Users reporting errors
- Error rate >5% (warning) or >10% (critical)

**Diagnosis Steps:**

1. **Identify failing routes:**
   ```bash
   # Check Prometheus for error rates by route
   # Query: rate(http_requests_total{service="coordinator",status=~"5.."}[5m])
   ```

2. **Check application logs:**
   ```bash
   # Filter for errors
   grep -i error /var/log/coordinator/app.log | tail -50
   
   # Check for specific error patterns
   grep -i "500\|Internal Server Error" /var/log/coordinator/app.log
   ```

3. **Check recent deployments:**
   - Review deployment history
   - Check if errors started after deployment
   - Review code changes

4. **Check downstream dependencies:**
   ```bash
   # Test database connectivity
   # Test external API calls
   # Check service dependencies
   ```

**Resolution Steps:**

1. **If specific route is failing:**
   - Check route handler code
   - Review recent changes
   - Check input validation
   - Test route in isolation

2. **If database errors:**
   - Check database connectivity
   - Check database logs
   - Verify connection pool settings
   - Check for deadlocks or long-running queries

3. **If external API errors:**
   - Check external service status
   - Verify API keys/credentials
   - Check rate limits
   - Implement retry logic if needed

4. **If code issue:**
   - Review recent code changes
   - Check for null pointer exceptions
   - Verify error handling
   - Consider hotfix or rollback

5. **Temporary mitigation:**
   - Disable problematic feature if possible
   - Add circuit breaker for failing dependencies
   - Increase error handling/retries

6. **Verify recovery:**
   ```bash
   # Monitor error rate in Grafana
   # Should decrease below threshold
   # Check Prometheus: rate(http_errors_total[5m])
   ```

**Prevention:**
- Comprehensive error handling
- Input validation
- Circuit breakers for external dependencies
- Regular load testing
- Monitoring and alerting

---

### HighLatencyP95

**Alert**: `HighLatencyP95` (severity: warning) or `HighLatencyP95Critical` (severity: critical)

**Symptoms:**
- p95 latency >2s (warning) or >5s (critical)
- Users reporting slow responses
- Timeout errors increasing

**Diagnosis Steps:**

1. **Identify slow routes:**
   ```bash
   # Check Prometheus for latency by route
   # Query: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
   ```

2. **Check database queries:**
   ```bash
   # Check for slow queries
   # Review database query logs
   # Check for missing indexes
   # Look for N+1 query problems
   ```

3. **Check external API calls:**
   - Monitor external API response times
   - Check for timeouts
   - Verify API rate limits

4. **Check system resources:**
   ```bash
   # CPU usage
   top
   
   # Memory usage
   free -h
   
   # Disk I/O
   iostat -x 1
   ```

5. **Check for bottlenecks:**
   - Review application logs for slow operations
   - Check for blocking operations
   - Review async/await usage

**Resolution Steps:**

1. **If database is slow:**
   - Optimize slow queries
   - Add missing indexes
   - Check for connection pool exhaustion
   - Consider read replicas
   - Review query plans

2. **If external API is slow:**
   - Implement timeout and retry logic
   - Add caching where appropriate
   - Consider async processing
   - Check API provider status

3. **If resource constrained:**
   - Scale up (more CPU/memory)
   - Scale out (more instances)
   - Optimize code
   - Check for memory leaks

4. **If code issue:**
   - Review slow code paths
   - Optimize algorithms
   - Add caching
   - Consider async processing

5. **Verify recovery:**
   ```bash
   # Monitor p95 latency in Grafana
   # Should decrease below threshold
   ```

**Prevention:**
- Performance testing
- Database query optimization
- Caching strategies
- Resource monitoring
- Load testing

---

### Security Violations

**Alerts**: `HighAuthFailureRate`, `RateLimitExceeded`, `SuspiciousActivity`, `InjectionAttempts`

**Symptoms:**
- High authentication failure rate
- Rate limit violations
- Multiple security events from same source
- Injection attempt detections

**Diagnosis Steps:**

1. **Review security logs:**
   ```bash
   # Check security event logs
   grep -i "security\|auth.*fail\|injection" /var/log/coordinator/security.log
   
   # Check for patterns
   grep -i "sql.*injection\|prompt.*injection" /var/log/coordinator/security.log
   ```

2. **Identify source:**
   - Check IP addresses
   - Check service IDs
   - Review correlation IDs
   - Check request patterns

3. **Check Prometheus metrics:**
   ```bash
   # Auth failures
   rate(auth_failures_total[5m])
   
   # Rate limit violations
   rate(rate_limit_violations_total[5m])
   ```

4. **Review audit logs:**
   - Check for suspicious patterns
   - Review failed authentication attempts
   - Check for injection patterns

**Resolution Steps:**

1. **If brute force attack:**
   ```bash
   # Block IP address (if using firewall)
   iptables -A INPUT -s <attacker-ip> -j DROP
   
   # Or use rate limiting (already implemented)
   # Adjust rate limits if needed
   ```

2. **If legitimate traffic:**
   - Review rate limit configuration
   - Adjust limits if too restrictive
   - Whitelist legitimate IPs if needed

3. **If injection attempts:**
   - Verify validation is working
   - Check that inputs are sanitized
   - Review security logs for patterns
   - Update validation rules if needed

4. **If compromised service:**
   - Revoke service credentials
   - Rotate JWT keys if needed
   - Review service access logs
   - Notify security team

5. **Notify security team:**
   - Document incident
   - Share logs and evidence
   - Follow security incident procedures

**Prevention:**
- Strong authentication
- Rate limiting
- Input validation
- Security monitoring
- Regular security audits

---

### Rate Limit Abuse

**Alert**: `RateLimitExceeded` (severity: warning or critical)

**Symptoms:**
- High rate of 429 responses
- Legitimate users may be affected
- Suspicious traffic patterns

**Diagnosis Steps:**

1. **Check rate limit metrics:**
   ```bash
   # Rate limit violations
   rate(rate_limit_violations_total[5m])
   ```

2. **Identify source:**
   - Check IP addresses
   - Check service IDs
   - Review request patterns

3. **Distinguish legitimate vs malicious:**
   - Review request patterns
   - Check for bot signatures
   - Review user behavior

**Resolution Steps:**

1. **If malicious traffic:**
   ```bash
   # Block IP address
   iptables -A INPUT -s <attacker-ip> -j DROP
   
   # Or use WAF/DDoS protection
   ```

2. **If legitimate traffic:**
   - Review rate limit configuration
   - Adjust limits if too restrictive
   - Consider per-user limits instead of per-IP

3. **If misconfigured limits:**
   - Review rate limit settings
   - Adjust based on actual traffic patterns
   - Test with legitimate load

**Prevention:**
- Appropriate rate limits
- Per-user limits where possible
- DDoS protection
- Monitoring and alerting

---

### Schema Change Failures

**Alert**: `RegistrationFailures` (when schema validation fails)

**Symptoms:**
- Service registrations failing
- Schema validation errors
- Services unable to register

**Diagnosis Steps:**

1. **Check registration logs:**
   ```bash
   # Check for schema validation errors
   grep -i "schema\|validation" /var/log/coordinator/app.log
   ```

2. **Review failed registrations:**
   - Check error messages
   - Review schema requirements
   - Check for breaking changes

3. **Test schema validation:**
   ```bash
   # Try registering with known good schema
   curl -X POST http://localhost:3000/register \
     -H "Content-Type: application/json" \
     -d '{"name":"test","url":"http://localhost:3001","schema":{...}}'
   ```

**Resolution Steps:**

1. **If schema format issue:**
   - Review schema documentation
   - Update client code
   - Provide clear error messages

2. **If validation too strict:**
   - Review validation rules
   - Adjust if needed
   - Document changes

3. **If breaking change:**
   - Consider versioning
   - Support both old and new formats temporarily
   - Communicate changes to clients

4. **Verify recovery:**
   ```bash
   # Test registration
   curl -X POST http://localhost:3000/register \
     -H "Content-Type: application/json" \
     -d '{"name":"test","url":"http://localhost:3001"}'
   ```

**Prevention:**
- Schema versioning
- Clear documentation
- Backward compatibility
- Gradual rollout

---

## Rollback Procedures

### Coordinator Service Rollback

**Quick Rollback (if using version control):**

1. **Identify last known good version:**
   ```bash
   git log --oneline
   # Find commit hash of last working version
   ```

2. **Rollback code:**
   ```bash
   git checkout <last-good-commit>
   # or
   git revert <bad-commit>
   ```

3. **Restart service:**
   ```bash
   # Stop current service
   pkill -f "node.*test-server"
   
   # Start with rolled back version
   node test-server.js
   ```

**Docker/Container Rollback:**

```bash
# Rollback to previous image
docker-compose down
docker-compose up -d --scale coordinator=0
docker-compose up -d coordinator:<previous-tag>
```

**Kubernetes Rollback:**

```bash
# Rollback deployment
kubectl rollout undo deployment/coordinator

# Or rollback to specific revision
kubectl rollout undo deployment/coordinator --to-revision=2
```

### Configuration Rollback

1. **Identify configuration change:**
   ```bash
   # Check config file history
   git log infra/monitoring/prometheus.yml
   ```

2. **Restore previous config:**
   ```bash
   git checkout HEAD~1 infra/monitoring/prometheus.yml
   ```

3. **Reload configuration:**
   ```bash
   # Prometheus
   curl -X POST http://localhost:9090/-/reload
   
   # Or restart service
   systemctl restart prometheus
   ```

### Feature Flag Rollback

If using feature flags:

1. **Disable problematic feature:**
   ```bash
   # Set environment variable
   export DISABLE_NEW_FEATURE=true
   
   # Or update config
   # featureFlags: { newFeature: false }
   ```

2. **Restart service:**
   ```bash
   systemctl restart coordinator
   ```

---

## Post-Incident Review

### Post-Mortem Template

**Incident Summary:**
- **Date/Time**: [When did it occur?]
- **Duration**: [How long did it last?]
- **Severity**: [Critical/Warning/Info]
- **Impact**: [What was affected?]
- **Root Cause**: [What caused it?]

**Timeline:**
```
[Time] - Alert fired
[Time] - Incident declared
[Time] - Investigation started
[Time] - Root cause identified
[Time] - Fix applied
[Time] - Service restored
[Time] - Incident resolved
```

**Actions Taken:**
1. [Action 1]
2. [Action 2]
3. [Action 3]

**Root Cause Analysis:**
- **Primary Cause**: [Main cause]
- **Contributing Factors**: [Additional factors]
- **Why it wasn't caught**: [Prevention gaps]

**Lessons Learned:**
- **What went well**: [Positive aspects]
- **What could be improved**: [Areas for improvement]
- **Action Items**: 
  - [ ] [Action item 1]
  - [ ] [Action item 2]
  - [ ] [Action item 3]

**Prevention Measures:**
- [ ] [Prevention measure 1]
- [ ] [Prevention measure 2]
- [ ] [Prevention measure 3]

### What to Capture

- **Timeline**: Detailed timeline of events
- **Metrics**: Screenshots of Grafana/Prometheus during incident
- **Logs**: Relevant log entries with correlation IDs
- **Actions**: All actions taken and their results
- **Communication**: All communications (Slack, email, etc.)
- **Impact**: User impact, business impact, data impact
- **Resolution**: How it was resolved
- **Follow-ups**: Action items and owners

---

## Monitoring During Incidents

### Key Dashboards to Watch

1. **Coordinator Service Dashboard** (Grafana)
   - Error rate panel
   - Latency panel (p95)
   - Request rate panel
   - Active alerts panel

2. **Prometheus Alerts** (Prometheus UI)
   - Firing alerts
   - Alert details and labels
   - Alert history

3. **System Resources** (if available)
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network traffic

### Key Metrics to Monitor

**During Incident:**
- `http_requests_total` - Request volume
- `http_errors_total` - Error count
- `http_request_duration_seconds` - Latency
- `up{job="coordinator"}` - Service availability
- Alert firing status

**After Resolution:**
- Error rate trending down
- Latency returning to normal
- Service availability restored
- Alerts clearing

### Log Queries to Run

**Note**: Logging will be implemented in Iteration 4. Once available:

1. **By Correlation ID:**
   ```bash
   # Find all logs for a specific request
   grep "correlationId=abc-123" /var/log/coordinator/app.log
   ```

2. **By Error Type:**
   ```bash
   # Find all errors
   grep '"level":"error"' /var/log/coordinator/app.log | tail -50
   ```

3. **By Route:**
   ```bash
   # Find all requests to a specific route
   grep '"route":"/register"' /var/log/coordinator/app.log
   ```

4. **By Time Range:**
   ```bash
   # Find logs in last hour
   grep "$(date -d '1 hour ago' +%Y-%m-%d)" /var/log/coordinator/app.log
   ```

5. **Security Events:**
   ```bash
   # Find security events
   grep '"level":"security"' /var/log/coordinator/security.log
   ```

---

## Quick Reference

### Alert Severity Guide

| Alert | Severity | Response Time | Runbook |
|-------|----------|---------------|---------|
| CoordinatorDown | Critical | < 5 min | [CoordinatorDown](#coordinatordown) |
| HighErrorRateCritical | Critical | < 5 min | [HighErrorRate](#higherrorrate) |
| HighLatencyP95Critical | Critical | < 5 min | [HighLatencyP95](#highlatencyp95) |
| HighErrorRate | Warning | < 15 min | [HighErrorRate](#higherrorrate) |
| HighLatencyP95 | Warning | < 15 min | [HighLatencyP95](#highlatencyp95) |
| RegistrationFailures | Warning | < 15 min | [Schema Change Failures](#schema-change-failures) |
| RoutingFailures | Warning | < 15 min | Check routing logic |
| HighAuthFailureRate | Warning | < 15 min | [Security Violations](#security-violations) |
| RateLimitExceeded | Warning | < 15 min | [Rate Limit Abuse](#rate-limit-abuse) |
| SuspiciousActivity | Warning | < 15 min | [Security Violations](#security-violations) |
| InjectionAttempts | Warning | < 15 min | [Security Violations](#security-violations) |

### Emergency Contacts

- **On-Call Engineer**: [Contact info]
- **Team Lead**: [Contact info]
- **Engineering Manager**: [Contact info]
- **Security Team**: [Contact info]

### Useful Commands

```bash
# Check service status
curl http://localhost:3000/health

# Check metrics
curl http://localhost:3000/metrics

# View Prometheus alerts
# Open http://localhost:9090/alerts

# View Grafana dashboard
# Open http://localhost:3001

# Restart service
systemctl restart coordinator
# or
node test-server.js
```

---

**Remember**: Stay calm, follow procedures, document everything, and communicate clearly! 🚨

