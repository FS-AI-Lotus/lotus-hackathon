#!/bin/bash

# Comprehensive Test Script for Coordinator Microservice Advanced Features
# Tests all new functionality including two-stage registration, AI routing, schemas, etc.

set -e

# Configuration
BASE_URL="http://localhost:3000"
COORDINATOR_URL="$BASE_URL"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Test function
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local expected_status="$4"
    local description="$5"
    
    log_info "Testing: $description"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$COORDINATOR_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$COORDINATOR_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        log_success "$description (HTTP $http_code)"
        echo "Response: $body" | head -c 200
        echo ""
        echo ""
        return 0
    else
        log_error "$description (Expected HTTP $expected_status, got $http_code)"
        echo "Response: $body"
        echo ""
        return 1
    fi
}

# Store service ID for later tests
SERVICE_ID=""

echo "======================================"
echo "Coordinator Advanced Features Test Suite"
echo "======================================"
echo ""

# Test 1: Health Check
log_info "=== Testing Health Check ==="
test_endpoint "GET" "/health" "" 200 "Health check endpoint"

# Test 2: Root endpoint with new features
log_info "=== Testing Root Endpoint ==="
test_endpoint "GET" "/" "" 200 "Root endpoint with feature list"

# Test 3: Stage 1 Registration (New Two-Stage Process)
log_info "=== Testing Two-Stage Registration ==="
log_info "--- Stage 1: Basic Registration ---"

STAGE1_DATA='{
  "serviceName": "test-payment-service",
  "version": "1.2.0",
  "endpoint": "http://test-payment:4000",
  "healthCheck": "/health",
  "description": "Test payment processing service for advanced features",
  "metadata": {
    "team": "Team 5",
    "owner": "test-team@example.com",
    "capabilities": ["payments", "refunds", "transactions"]
  }
}'

if test_endpoint "POST" "/register" "$STAGE1_DATA" 201 "Stage 1: Service registration"; then
    # Extract service ID from response
    SERVICE_ID=$(echo "$body" | grep -o '"serviceId":"[^"]*"' | cut -d'"' -f4)
    log_info "Extracted Service ID: $SERVICE_ID"
fi

# Test 4: Stage 2 Registration (Migration Upload)
if [ -n "$SERVICE_ID" ]; then
    log_info "--- Stage 2: Migration Upload ---"
    
    STAGE2_DATA='{
      "migrationFile": {
        "version": "1.2.0",
        "database": {
          "tables": [
            {
              "name": "payments",
              "schema": {
                "id": "uuid",
                "amount": "decimal",
                "currency": "string",
                "status": "string"
              }
            },
            {
              "name": "transactions",
              "schema": {
                "id": "uuid",
                "payment_id": "uuid",
                "type": "string",
                "timestamp": "datetime"
              }
            }
          ],
          "migrations": ["001_create_payments", "002_create_transactions"]
        },
        "api": {
          "endpoints": [
            {
              "path": "/api/payment/process",
              "method": "POST",
              "description": "Process a payment",
              "requestSchema": {
                "required": ["amount", "currency"],
                "properties": {
                  "amount": {"type": "number"},
                  "currency": {"type": "string"}
                }
              },
              "responseSchema": {
                "properties": {
                  "paymentId": {"type": "string"},
                  "status": {"type": "string"}
                }
              }
            },
            {
              "path": "/api/payment/refund",
              "method": "POST",
              "description": "Process a refund"
            }
          ]
        },
        "dependencies": ["notification-service", "audit-service"],
        "events": {
          "publishes": ["payment.completed", "payment.failed", "refund.processed"],
          "subscribes": ["order.created", "user.verified"]
        }
      }
    }'
    
    test_endpoint "POST" "/register/$SERVICE_ID/migration" "$STAGE2_DATA" 200 "Stage 2: Migration file upload"
else
    log_error "Cannot test Stage 2: No Service ID from Stage 1"
fi

# Test 5: Service Details Endpoint
if [ -n "$SERVICE_ID" ]; then
    log_info "=== Testing Service Details ==="
    test_endpoint "GET" "/services/$SERVICE_ID" "" 200 "Get service details by ID"
fi

# Test 6: List Services (should now show active service)
log_info "=== Testing Service Discovery ==="
test_endpoint "GET" "/services" "" 200 "List all active services"
test_endpoint "GET" "/services?includeAll=true" "" 200 "List all services (including pending)"

# Test 7: AI Routing
log_info "=== Testing AI-Powered Routing ==="

ROUTING_DATA='{
  "data": {
    "type": "payment_request",
    "payload": {
      "amount": 100.50,
      "currency": "USD",
      "description": "Purchase payment for order #12345"
    },
    "context": {
      "userId": "user-123",
      "orderId": "order-12345"
    }
  },
  "routing": {
    "strategy": "single",
    "priority": "accuracy"
  }
}'

test_endpoint "POST" "/route" "$ROUTING_DATA" 200 "AI routing for payment request"

# Test another routing scenario
ROUTING_DATA2='{
  "data": {
    "type": "notification_request",
    "payload": {
      "type": "email",
      "recipient": "user@example.com",
      "subject": "Payment Confirmation"
    }
  },
  "routing": {
    "strategy": "multiple"
  }
}'

test_endpoint "POST" "/route" "$ROUTING_DATA2" 200 "AI routing for notification request"

# Test 8: Routing Context
test_endpoint "GET" "/route/context" "" 200 "Get routing context"

# Test 9: Schema Registry
log_info "=== Testing Schema Registry ==="
test_endpoint "GET" "/schemas" "" 200 "List all schemas"

if [ -n "$SERVICE_ID" ]; then
    test_endpoint "GET" "/schemas/$SERVICE_ID" "" 200 "Get schemas for specific service"
    
    # Test schema validation
    VALIDATION_DATA='{
      "data": {
        "amount": 100.50,
        "currency": "USD"
      },
      "schemaType": "api_request",
      "schemaName": "POST_/api/payment/process"
    }'
    
    test_endpoint "POST" "/schemas/$SERVICE_ID/validate" "$VALIDATION_DATA" 200 "Validate data against schema"
fi

# Test 10: Changelog
log_info "=== Testing Changelog ==="
test_endpoint "GET" "/changelog" "" 200 "Get system changelog"
test_endpoint "GET" "/changelog/stats" "" 200 "Get changelog statistics"
test_endpoint "GET" "/changelog/search?q=payment" "" 200 "Search changelog"

# Test 11: Knowledge Graph
log_info "=== Testing Knowledge Graph ==="
test_endpoint "GET" "/knowledge-graph" "" 200 "Get knowledge graph"

# Test 12: Enhanced Metrics
log_info "=== Testing Enhanced Metrics ==="
test_endpoint "GET" "/metrics" "" 200 "Get Prometheus metrics"
test_endpoint "GET" "/metrics/json" "" 200 "Get JSON metrics"

# Test 13: UI/UX Config (existing feature)
log_info "=== Testing UI/UX Configuration ==="
test_endpoint "GET" "/uiux" "" 200 "Get UI/UX configuration"

# Test 14: Error Handling Tests
log_info "=== Testing Error Handling ==="

# Test invalid service ID
test_endpoint "GET" "/services/invalid-id" "" 404 "Get non-existent service"

# Test invalid migration upload
INVALID_MIGRATION='{
  "migrationFile": {
    "invalid": "data"
  }
}'
test_endpoint "POST" "/register/invalid-id/migration" "$INVALID_MIGRATION" 404 "Upload migration to non-existent service"

# Test invalid routing data
INVALID_ROUTING='{
  "invalid": "data"
}'
test_endpoint "POST" "/route" "$INVALID_ROUTING" 400 "Invalid routing request"

# Test 15: Registration Edge Cases
log_info "=== Testing Registration Edge Cases ==="

# Test duplicate service name
DUPLICATE_DATA='{
  "serviceName": "test-payment-service",
  "version": "1.3.0",
  "endpoint": "http://test-payment-2:4000",
  "healthCheck": "/health"
}'
test_endpoint "POST" "/register" "$DUPLICATE_DATA" 400 "Duplicate service name registration"

# Test invalid version format
INVALID_VERSION='{
  "serviceName": "test-service-invalid",
  "version": "invalid-version",
  "endpoint": "http://test:4000",
  "healthCheck": "/health"
}'
test_endpoint "POST" "/register" "$INVALID_VERSION" 400 "Invalid version format"

# Test 16: Migration Update (PUT endpoint)
if [ -n "$SERVICE_ID" ]; then
    log_info "=== Testing Migration Update ==="
    
    UPDATED_MIGRATION='{
      "migrationFile": {
        "version": "1.2.1",
        "database": {
          "tables": [
            {
              "name": "payments",
              "schema": {
                "id": "uuid",
                "amount": "decimal",
                "currency": "string",
                "status": "string",
                "created_at": "timestamp"
              }
            }
          ]
        },
        "api": {
          "endpoints": [
            {
              "path": "/api/payment/process",
              "method": "POST",
              "description": "Process a payment (updated)"
            }
          ]
        },
        "dependencies": ["notification-service"],
        "events": {
          "publishes": ["payment.completed", "payment.failed"],
          "subscribes": ["order.created"]
        }
      }
    }'
    
    test_endpoint "PUT" "/register/$SERVICE_ID/migration" "$UPDATED_MIGRATION" 200 "Update migration file"
fi

# Test 17: Advanced Routing Strategies
log_info "=== Testing Advanced Routing Strategies ==="

BROADCAST_ROUTING='{
  "data": {
    "type": "system_alert",
    "payload": {
      "level": "critical",
      "message": "System maintenance in 5 minutes"
    }
  },
  "routing": {
    "strategy": "broadcast",
    "priority": "speed"
  }
}'

test_endpoint "POST" "/route" "$BROADCAST_ROUTING" 200 "Broadcast routing strategy"

# Summary
echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! 🎉${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the output above.${NC}"
    exit 1
fi

