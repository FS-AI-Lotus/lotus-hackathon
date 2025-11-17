/**
 * Monitoring Configuration Tests
 * 
 * Validates that Prometheus and Grafana configuration files are valid.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('Monitoring Configuration Files', () => {
  const monitoringDir = path.join(__dirname, '../infra/monitoring');

  describe('prometheus.yml', () => {
    let prometheusConfig;

    beforeAll(() => {
      const configPath = path.join(monitoringDir, 'prometheus.yml');
      const configContent = fs.readFileSync(configPath, 'utf8');
      prometheusConfig = yaml.load(configContent);
    });

    test('should parse as valid YAML', () => {
      expect(prometheusConfig).toBeDefined();
      expect(typeof prometheusConfig).toBe('object');
    });

    test('should have global configuration', () => {
      expect(prometheusConfig.global).toBeDefined();
      expect(prometheusConfig.global.scrape_interval).toBeDefined();
      expect(prometheusConfig.global.evaluation_interval).toBeDefined();
    });

    test('should have rule_files configuration', () => {
      expect(prometheusConfig.rule_files).toBeDefined();
      expect(Array.isArray(prometheusConfig.rule_files)).toBe(true);
      expect(prometheusConfig.rule_files).toContain('alerts.yml');
    });

    test('should have scrape_configs', () => {
      expect(prometheusConfig.scrape_configs).toBeDefined();
      expect(Array.isArray(prometheusConfig.scrape_configs)).toBe(true);
    });

    test('should have coordinator job configuration', () => {
      const coordinatorJob = prometheusConfig.scrape_configs.find(
        job => job.job_name === 'coordinator'
      );
      
      expect(coordinatorJob).toBeDefined();
      expect(coordinatorJob.metrics_path).toBe('/metrics');
      expect(coordinatorJob.static_configs).toBeDefined();
      expect(Array.isArray(coordinatorJob.static_configs)).toBe(true);
    });

    test('should have coordinator job labels', () => {
      const coordinatorJob = prometheusConfig.scrape_configs.find(
        job => job.job_name === 'coordinator'
      );
      
      const staticConfig = coordinatorJob.static_configs[0];
      expect(staticConfig.labels).toBeDefined();
      expect(staticConfig.labels.service).toBe('coordinator');
    });
  });

  describe('alerts.yml', () => {
    let alertsConfig;

    beforeAll(() => {
      const configPath = path.join(monitoringDir, 'alerts.yml');
      const configContent = fs.readFileSync(configPath, 'utf8');
      alertsConfig = yaml.load(configContent);
    });

    test('should parse as valid YAML', () => {
      expect(alertsConfig).toBeDefined();
      expect(typeof alertsConfig).toBe('object');
    });

    test('should have groups', () => {
      expect(alertsConfig.groups).toBeDefined();
      expect(Array.isArray(alertsConfig.groups)).toBe(true);
      expect(alertsConfig.groups.length).toBeGreaterThan(0);
    });

    test('should have service failure alert group', () => {
      const serviceFailureGroup = alertsConfig.groups.find(
        group => group.name === 'coordinator_service_failures'
      );
      
      expect(serviceFailureGroup).toBeDefined();
      expect(serviceFailureGroup.rules).toBeDefined();
      expect(Array.isArray(serviceFailureGroup.rules)).toBe(true);
    });

    test('should have security violation alert group', () => {
      const securityGroup = alertsConfig.groups.find(
        group => group.name === 'coordinator_security_violations'
      );
      
      expect(securityGroup).toBeDefined();
      expect(securityGroup.rules).toBeDefined();
      expect(Array.isArray(securityGroup.rules)).toBe(true);
    });

    test('should have CoordinatorDown alert', () => {
      const serviceFailureGroup = alertsConfig.groups.find(
        group => group.name === 'coordinator_service_failures'
      );
      
      const coordinatorDownAlert = serviceFailureGroup.rules.find(
        rule => rule.alert === 'CoordinatorDown'
      );
      
      expect(coordinatorDownAlert).toBeDefined();
      expect(coordinatorDownAlert.expr).toBeDefined();
      expect(coordinatorDownAlert.labels).toBeDefined();
      expect(coordinatorDownAlert.labels.severity).toBe('critical');
      expect(coordinatorDownAlert.labels.team).toBe('team4');
    });

    test('should have HighErrorRate alert', () => {
      const serviceFailureGroup = alertsConfig.groups.find(
        group => group.name === 'coordinator_service_failures'
      );
      
      const highErrorRateAlert = serviceFailureGroup.rules.find(
        rule => rule.alert === 'HighErrorRate'
      );
      
      expect(highErrorRateAlert).toBeDefined();
      expect(highErrorRateAlert.expr).toBeDefined();
      expect(highErrorRateAlert.labels.severity).toBe('warning');
    });

    test('should have HighAuthFailureRate alert', () => {
      const securityGroup = alertsConfig.groups.find(
        group => group.name === 'coordinator_security_violations'
      );
      
      const authFailureAlert = securityGroup.rules.find(
        rule => rule.alert === 'HighAuthFailureRate'
      );
      
      expect(authFailureAlert).toBeDefined();
      expect(authFailureAlert.labels.severity).toBe('warning');
      expect(authFailureAlert.labels.component).toBe('security');
    });

    test('all alerts should have required labels', () => {
      alertsConfig.groups.forEach(group => {
        group.rules.forEach(rule => {
          expect(rule.labels).toBeDefined();
          expect(rule.labels.severity).toBeDefined();
          expect(['warning', 'critical']).toContain(rule.labels.severity);
          expect(rule.labels.team).toBe('team4');
          expect(rule.labels.component).toBeDefined();
        });
      });
    });

    test('all alerts should have annotations', () => {
      alertsConfig.groups.forEach(group => {
        group.rules.forEach(rule => {
          expect(rule.annotations).toBeDefined();
          expect(rule.annotations.summary).toBeDefined();
          expect(rule.annotations.description).toBeDefined();
        });
      });
    });
  });

  describe('grafana-dashboard-coordinator.json', () => {
    let dashboardConfig;

    beforeAll(() => {
      const configPath = path.join(monitoringDir, 'grafana-dashboard-coordinator.json');
      const configContent = fs.readFileSync(configPath, 'utf8');
      dashboardConfig = JSON.parse(configContent);
    });

    test('should parse as valid JSON', () => {
      expect(dashboardConfig).toBeDefined();
      expect(typeof dashboardConfig).toBe('object');
    });

    test('should have dashboard object', () => {
      expect(dashboardConfig.dashboard).toBeDefined();
    });

    test('should have required dashboard properties', () => {
      const dashboard = dashboardConfig.dashboard;
      expect(dashboard.title).toBeDefined();
      expect(dashboard.refresh).toBe('10s'); // Required: ≤10s refresh
      expect(dashboard.panels).toBeDefined();
      expect(Array.isArray(dashboard.panels)).toBe(true);
    });

    test('should have panels for all required metrics', () => {
      const dashboard = dashboardConfig.dashboard;
      const panelTitles = dashboard.panels.map(p => p.title.toLowerCase());
      
      // Required panels
      expect(panelTitles.some(t => t.includes('requests per second') || t.includes('requests/sec'))).toBe(true);
      expect(panelTitles.some(t => t.includes('p95') && t.includes('latency'))).toBe(true);
      expect(panelTitles.some(t => t.includes('error rate'))).toBe(true);
      expect(panelTitles.some(t => t.includes('uptime'))).toBe(true);
      expect(panelTitles.some(t => t.includes('registration'))).toBe(true);
      expect(panelTitles.some(t => t.includes('routing'))).toBe(true);
    });

    test('should have valid panel structure', () => {
      const dashboard = dashboardConfig.dashboard;
      
      dashboard.panels.forEach(panel => {
        expect(panel.id).toBeDefined();
        expect(panel.title).toBeDefined();
        expect(panel.type).toBeDefined();
        expect(panel.gridPos).toBeDefined();
        expect(panel.targets).toBeDefined();
        expect(Array.isArray(panel.targets)).toBe(true);
      });
    });

    test('should have Prometheus queries in panels', () => {
      const dashboard = dashboardConfig.dashboard;
      
      dashboard.panels.forEach(panel => {
        panel.targets.forEach(target => {
          expect(target.expr).toBeDefined();
          expect(typeof target.expr).toBe('string');
          // Should contain Prometheus query expressions
          expect(target.expr.length).toBeGreaterThan(0);
        });
      });
    });

    test('should use coordinator service label in queries', () => {
      const dashboard = dashboardConfig.dashboard;
      let foundCoordinatorQuery = false;
      
      dashboard.panels.forEach(panel => {
        panel.targets.forEach(target => {
          if (target.expr && target.expr.includes('service="coordinator"')) {
            foundCoordinatorQuery = true;
          }
        });
      });
      
      expect(foundCoordinatorQuery).toBe(true);
    });
  });
});

