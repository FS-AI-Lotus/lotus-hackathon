#!/bin/bash

# Team 4 Monitoring Setup Script
# This script helps you set up and manage the monitoring stack

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.monitoring.yml"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed"
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_success "Docker Compose is installed"
    
    if ! command -v curl &> /dev/null; then
        print_warning "curl is not installed. Some checks may not work."
    else
        print_success "curl is installed"
    fi
}

start_monitoring() {
    print_header "Starting Team 4 Monitoring Stack"
    
    cd "$PROJECT_ROOT"
    
    # Set Coordinator host if not set
    if [ -z "$COORDINATOR_HOST" ]; then
        export COORDINATOR_HOST="host.docker.internal:3000"
        print_info "Using default COORDINATOR_HOST: $COORDINATOR_HOST"
        print_info "Set COORDINATOR_HOST environment variable to change this"
    fi
    
    # Start services
    print_info "Starting Prometheus and Grafana..."
    # Try docker compose (modern) first, fallback to docker-compose (legacy)
    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" up -d
    else
        docker-compose -f "$COMPOSE_FILE" up -d
    fi
    
    print_success "Monitoring stack started!"
    echo ""
    print_info "Services:"
    echo "  📊 Prometheus: http://localhost:9090"
    echo "  📈 Grafana:    http://localhost:4000 (admin/admin)"
    echo ""
    print_info "Waiting for services to be ready..."
    sleep 5
    
    # Check services
    check_services
}

stop_monitoring() {
    print_header "Stopping Team 4 Monitoring Stack"
    
    cd "$PROJECT_ROOT"
    # Try docker compose (modern) first, fallback to docker-compose (legacy)
    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" down
    else
        docker-compose -f "$COMPOSE_FILE" down
    fi
    
    print_success "Monitoring stack stopped!"
}

restart_monitoring() {
    print_header "Restarting Team 4 Monitoring Stack"
    stop_monitoring
    sleep 2
    start_monitoring
}

check_services() {
    print_info "Checking service health..."
    
    # Check Prometheus
    if curl -s http://localhost:9090/-/healthy > /dev/null; then
        print_success "Prometheus is running (http://localhost:9090)"
    else
        print_error "Prometheus is not responding"
    fi
    
    # Check Grafana
    if curl -s http://localhost:4000/api/health > /dev/null; then
        print_success "Grafana is running (http://localhost:4000)"
    else
        print_warning "Grafana may still be starting up..."
    fi
    
    # Check Coordinator connection (if test server is running)
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        print_success "Coordinator/test server is reachable"
    else
        print_warning "Coordinator/test server is not running on port 3000"
        print_info "Start test server with: node test-server.js"
    fi
}

check_prometheus_targets() {
    print_header "Checking Prometheus Targets"
    
    print_info "Opening Prometheus targets page..."
    print_info "Check: http://localhost:9090/targets"
    
    # Try to check via API if jq is available
    if command -v jq &> /dev/null; then
        TARGETS=$(curl -s http://localhost:9090/api/v1/targets | jq -r '.data.activeTargets[] | "\(.labels.job): \(.health)"')
        if [ -n "$TARGETS" ]; then
            echo "$TARGETS"
        fi
    else
        print_info "Install 'jq' for better target status display"
    fi
}

view_logs() {
    print_header "Monitoring Stack Logs"
    cd "$PROJECT_ROOT"
    # Try docker compose (modern) first, fallback to docker-compose (legacy)
    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" logs -f
    else
        docker-compose -f "$COMPOSE_FILE" logs -f
    fi
}

clean_data() {
    print_header "Cleaning Monitoring Data"
    
    read -p "This will delete all Prometheus and Grafana data. Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$PROJECT_ROOT"
        # Try docker compose (modern) first, fallback to docker-compose (legacy)
        if docker compose version &> /dev/null; then
            docker compose -f "$COMPOSE_FILE" down -v
        else
            docker-compose -f "$COMPOSE_FILE" down -v
        fi
        print_success "All monitoring data cleaned!"
    else
        print_info "Cancelled"
    fi
}

show_status() {
    print_header "Team 4 Monitoring Stack Status"
    
    cd "$PROJECT_ROOT"
    # Try docker compose (modern) first, fallback to docker-compose (legacy)
    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" ps
    else
        docker-compose -f "$COMPOSE_FILE" ps
    fi
    
    echo ""
    check_services
}

# Main script
case "${1:-}" in
    start)
        check_dependencies
        start_monitoring
        ;;
    stop)
        stop_monitoring
        ;;
    restart)
        check_dependencies
        restart_monitoring
        ;;
    status)
        show_status
        ;;
    check)
        check_services
        ;;
    targets)
        check_prometheus_targets
        ;;
    logs)
        view_logs
        ;;
    clean)
        clean_data
        ;;
    *)
        echo "Team 4 Monitoring Setup Script"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|check|targets|logs|clean}"
        echo ""
        echo "Commands:"
        echo "  start    - Start Prometheus and Grafana"
        echo "  stop     - Stop Prometheus and Grafana"
        echo "  restart  - Restart the monitoring stack"
        echo "  status   - Show status of all services"
        echo "  check    - Check if services are healthy"
        echo "  targets  - Check Prometheus targets"
        echo "  logs     - View logs from all services"
        echo "  clean    - Remove all data (Prometheus + Grafana)"
        echo ""
        echo "Environment Variables:"
        echo "  COORDINATOR_HOST - Coordinator host:port (default: host.docker.internal:3000)"
        echo ""
        exit 1
        ;;
esac

