# Monitoring Infrastructure Configuration

This directory contains Prometheus and Grafana configuration files for monitoring the Coordinator service.

## Files

- **`prometheus.yml`** - Prometheus scrape configuration
- **`alerts.yml`** - Prometheus alerting rules
- **`grafana-dashboard-coordinator.json`** - Grafana dashboard definition

## Setup Instructions

### Prometheus

1. **Copy configuration files:**
   ```bash
   cp prometheus.yml /etc/prometheus/prometheus.yml
   cp alerts.yml /etc/prometheus/alerts.yml
   ```

2. **Update hostname/port:**
   - Replace `${COORDINATOR_HOST:-localhost:3000}` with actual Coordinator hostname:port
   - Or set `COORDINATOR_HOST` environment variable

3. **Start Prometheus:**
   ```bash
   prometheus --config.file=/etc/prometheus/prometheus.yml
   ```

4. **Verify:**
   - Open Prometheus UI: http://localhost:9090
   - Check "Status > Targets" - Coordinator should show as "UP"
   - Check "Alerts" tab to see configured alert rules

### Grafana

1. **Import dashboard:**
   - Open Grafana UI: http://localhost:3001
   - Go to "Dashboards" > "Import"
   - Click "Upload JSON file" and select `grafana-dashboard-coordinator.json`
   - Or paste the JSON content directly
   - Click "Import"

2. **Configure data source:**
   - Go to "Configuration" > "Data Sources"
   - Add Prometheus data source
   - URL: `http://prometheus:9090` (adjust based on your setup)
   - Click "Save & Test"

3. **View dashboard:**
   - Navigate to "Dashboards" > "Coordinator Service - Monitoring Dashboard"
   - Dashboard refreshes every 10 seconds automatically

## Dashboard Panels

### Required Panels (Hackathon Deliverables)

1. **Requests/sec** - Per route, per service
2. **p95 Latency** - Per route
3. **Error Rate %** - Overall error percentage
4. **Uptime** - Service uptime duration
5. **Service Registrations** - Over time (success vs failed)
6. **Routing Operations** - Success vs failed

### Additional Panels

- Total Requests
- p50 Latency
- HTTP Status Code Distribution
- Request Rate by Method
- Error Count by Status
- Active Alerts

## Alert Rules

### Service Failure Alerts

- **CoordinatorDown** - Service is down for >2 minutes
- **HighErrorRate** - Error rate >5% (warning) or >10% (critical)
- **HighLatencyP95** - p95 latency >2s (warning) or >5s (critical)
- **RegistrationFailures** - High rate of registration failures
- **RoutingFailures** - High rate of routing failures

### Security Violation Alerts

- **HighAuthFailureRate** - High authentication failure rate
- **RateLimitExceeded** - Sustained rate limit violations
- **SuspiciousActivity** - Multiple security events from same source
- **InjectionAttempts** - SQL/prompt injection attempts detected

**Note:** Some security alerts have placeholder expressions that need to be updated when auth/security metrics are implemented in later iterations.

## Threshold Tuning

Alert thresholds can be tuned in `alerts.yml`. See comments in the file for guidance on:
- Setting warning vs critical thresholds
- Adjusting based on SLO requirements
- Establishing baselines

## Environment Variables

- `COORDINATOR_HOST` - Coordinator service hostname:port (default: `localhost:3000`)
- `ENVIRONMENT` - Environment name (default: `development`)

## Extending to Microservices

When microservices are ready:

1. Uncomment the microservices section in `prometheus.yml`
2. Add microservice targets
3. Create additional Grafana dashboards or add panels to existing dashboard
4. Add microservice-specific alert rules if needed

## Troubleshooting

### Prometheus not scraping Coordinator

- Check Coordinator `/metrics` endpoint is accessible
- Verify hostname:port in `prometheus.yml` is correct
- Check Prometheus logs for connection errors
- Verify network connectivity between Prometheus and Coordinator

### Alerts not firing

- Check alert expressions are valid (test in Prometheus UI)
- Verify metrics exist with expected labels
- Check alert rule evaluation interval
- Review Prometheus alert logs

### Grafana dashboard shows "No data"

- Verify Prometheus data source is configured correctly
- Check Prometheus is scraping Coordinator successfully
- Verify metric names match (check Prometheus UI)
- Check time range in Grafana

## Next Steps

- **Iteration 7**: Alert notifications and failure simulation
- **Integration**: Wire monitoring into Coordinator service
- **Team 1**: Deploy Prometheus and Grafana via Terraform

