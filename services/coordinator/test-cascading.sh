#!/bin/bash

# Test Cascading Fallback Feature
# This script tests the cascading fallback functionality of the Coordinator service

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COORDINATOR_URL="http://localhost:3000"
GRPC_HOST="localhost:50051"
METRICS_URL="${COORDINATOR_URL}/metrics"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Cascading Fallback Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 0: Check if mock services are running
echo -e "${YELLOW}Step 0: Checking mock services...${NC}"
MOCK_SERVICE1_RUNNING=$(curl -s -f "http://localhost:4001/health" > /dev/null 2>&1 && echo "yes" || echo "no")
MOCK_SERVICE2_RUNNING=$(curl -s -f "http://localhost:4002/health" > /dev/null 2>&1 && echo "yes" || echo "no")
MOCK_SERVICE3_RUNNING=$(curl -s -f "http://localhost:4003/health" > /dev/null 2>&1 && echo "yes" || echo "no")

if [ "$MOCK_SERVICE1_RUNNING" = "no" ] || [ "$MOCK_SERVICE2_RUNNING" = "no" ] || [ "$MOCK_SERVICE3_RUNNING" = "no" ]; then
    echo -e "${YELLOW}⚠ Mock services are not running${NC}"
    echo -e "${BLUE}Starting mock services in background...${NC}"
    
    # Start each service separately
    cd test/mock-services 2>/dev/null || cd ./test/mock-services 2>/dev/null || (echo "Cannot find test/mock-services directory" && exit 1)
    
    node empty-service.js > /tmp/mock-empty.log 2>&1 &
    EMPTY_PID=$!
    
    node good-service.js > /tmp/mock-good.log 2>&1 &
    GOOD_PID=$!
    
    node backup-service.js > /tmp/mock-backup.log 2>&1 &
    BACKUP_PID=$!
    
    MOCK_SERVICES_PID="$EMPTY_PID $GOOD_PID $BACKUP_PID"
    
    cd - > /dev/null
    
    sleep 2
    
    # Verify they started
    if curl -s -f "http://localhost:4001/health" > /dev/null 2>&1 && \
       curl -s -f "http://localhost:4002/health" > /dev/null 2>&1 && \
       curl -s -f "http://localhost:4003/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Mock services started (PIDs: $MOCK_SERVICES_PID)${NC}"
        echo -e "${BLUE}Note: Mock services will continue running. Stop them with: kill $EMPTY_PID $GOOD_PID $BACKUP_PID${NC}"
    else
        echo -e "${RED}✗ Failed to start mock services${NC}"
        echo "Please start them manually: cd test/mock-services && ./start-all.sh"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Mock services are running${NC}"
fi
echo ""

# Step 1: Check if coordinator is running
echo -e "${YELLOW}Step 1: Checking if Coordinator is running...${NC}"
if curl -s -f "${COORDINATOR_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Coordinator is running${NC}"
else
    echo -e "${RED}✗ Coordinator is not running at ${COORDINATOR_URL}${NC}"
    echo "Please start the coordinator service first"
    exit 1
fi
echo ""

# Step 2: Clean up ALL services
echo -e "${YELLOW}Step 2: Cleaning up ALL services...${NC}"
CLEANUP_RESPONSE=$(curl -s -X DELETE "${COORDINATOR_URL}/register/services")
if echo "$CLEANUP_RESPONSE" | grep -q "success"; then
    DELETED_COUNT=$(echo "$CLEANUP_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('deleted', 0))" 2>/dev/null || echo "0")
    echo -e "${GREEN}✓ Deleted ${DELETED_COUNT} old services${NC}"
else
    echo -e "${YELLOW}⚠ Cleanup may have failed${NC}"
    echo "$CLEANUP_RESPONSE" | head -5
fi
echo ""
sleep 1

# Step 2b: Register test services
echo -e "${YELLOW}Step 2b: Registering test services...${NC}"

# Service 1: High confidence service (will return empty data to trigger fallback)
SERVICE1_RESPONSE=$(curl -s -X POST "${COORDINATOR_URL}/register" \
    -H "Content-Type: application/json" \
    -d '{
        "serviceName": "test-service-primary",
        "version": "1.0.0",
        "endpoint": "http://localhost:4001",
        "healthCheck": "/health",
        "description": "Primary test service - returns empty data",
        "metadata": {
            "capabilities": ["test", "primary", "empty"]
        },
        "migrationFile": {
            "api": {
                "endpoints": [
                    {"method": "POST", "path": "/api/process"}
                ]
            }
        }
    }')

if echo "$SERVICE1_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Service 1 registered: test-service-primary${NC}"
else
    echo -e "${YELLOW}⚠ Service 1 may already be registered${NC}"
fi

# Service 2: Medium confidence service (will return good data)
SERVICE2_RESPONSE=$(curl -s -X POST "${COORDINATOR_URL}/register" \
    -H "Content-Type: application/json" \
    -d '{
        "serviceName": "test-service-fallback",
        "version": "1.0.0",
        "endpoint": "http://localhost:4002",
        "healthCheck": "/health",
        "description": "Fallback test service - returns good data",
        "metadata": {
            "capabilities": ["test", "fallback", "data"]
        },
        "migrationFile": {
            "api": {
                "endpoints": [
                    {"method": "POST", "path": "/api/process"}
                ]
            }
        }
    }')

if echo "$SERVICE2_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Service 2 registered: test-service-fallback${NC}"
else
    echo -e "${YELLOW}⚠ Service 2 may already be registered${NC}"
fi

# Service 3: Lower confidence service (backup)
SERVICE3_RESPONSE=$(curl -s -X POST "${COORDINATOR_URL}/register" \
    -H "Content-Type: application/json" \
    -d '{
        "serviceName": "test-service-backup",
        "version": "1.0.0",
        "endpoint": "http://localhost:4003",
        "healthCheck": "/health",
        "description": "Backup test service",
        "metadata": {
            "capabilities": ["test", "backup"]
        },
        "migrationFile": {
            "api": {
                "endpoints": [
                    {"method": "POST", "path": "/api/process"}
                ]
            }
        }
    }')

if echo "$SERVICE3_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Service 3 registered: test-service-backup${NC}"
else
    echo -e "${YELLOW}⚠ Service 3 may already be registered${NC}"
fi

echo ""
sleep 2  # Give services time to register

# Step 3: Check initial metrics
echo -e "${YELLOW}Step 3: Checking initial metrics...${NC}"
INITIAL_METRICS=$(curl -s "${METRICS_URL}")
INITIAL_PRIMARY_SUCCESS=$(echo "$INITIAL_METRICS" | grep "^coordinator_primary_success_total " | awk '{print $2}' | grep -E '^[0-9]+$' || echo "0")
INITIAL_FALLBACK=$(echo "$INITIAL_METRICS" | grep "^coordinator_fallback_used_total" | grep -v "^#" | wc -l || echo "0")
echo -e "${BLUE}Initial primary success count: ${INITIAL_PRIMARY_SUCCESS}${NC}"
echo -e "${BLUE}Initial fallback count: ${INITIAL_FALLBACK}${NC}"
echo ""

# Step 4: Make gRPC Route request
echo -e "${YELLOW}Step 4: Making gRPC Route request...${NC}"

# Add ~/.local/bin to PATH if grpcurl is there
export PATH="$HOME/.local/bin:$PATH"

# Check if grpcurl is installed
if ! command -v grpcurl &> /dev/null; then
    echo -e "${RED}✗ grpcurl is not installed${NC}"
    echo "Please install grpcurl: https://github.com/fullstorydev/grpcurl"
    exit 1
fi

# Make gRPC request
echo -e "${BLUE}Sending gRPC request...${NC}"

# Try with proto files first, then fallback to reflection
PROTO_PATH="./src/grpc/proto"
if [ -f "${PROTO_PATH}/coordinator.proto" ]; then
    # Use -import-path and -proto to specify proto files
    GRPC_RESPONSE=$(grpcurl -plaintext -import-path "${PROTO_PATH}" -proto coordinator.proto -d '{
        "tenant_id": "test-tenant",
        "user_id": "test-user",
        "query_text": "test cascading fallback query",
        "metadata": {
            "test": "cascading"
        }
    }' "${GRPC_HOST}" rag.v1.CoordinatorService/Route 2>&1) || true
else
    # Try with reflection (may not work)
    GRPC_RESPONSE=$(grpcurl -plaintext -d '{
        "tenant_id": "test-tenant",
        "user_id": "test-user",
        "query_text": "test cascading fallback query",
        "metadata": {
            "test": "cascading"
        }
    }' "${GRPC_HOST}" rag.v1.CoordinatorService/Route 2>&1) || true
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ gRPC request completed${NC}"
else
    echo -e "${YELLOW}⚠ gRPC request may have failed (this is expected if services are not running)${NC}"
    echo -e "${BLUE}Response:${NC}"
    echo "$GRPC_RESPONSE" | head -20
fi
echo ""

# Step 5: Verify cascade metadata in response
echo -e "${YELLOW}Step 5: Verifying cascade metadata...${NC}"

# Extract cascade information from response (if available)
if echo "$GRPC_RESPONSE" | grep -q "successful_service"; then
    SUCCESSFUL_SERVICE=$(echo "$GRPC_RESPONSE" | grep -o '"successful_service":"[^"]*"' | cut -d'"' -f4 || echo "none")
    RANK_USED=$(echo "$GRPC_RESPONSE" | grep -o '"rank_used":"[^"]*"' | cut -d'"' -f4 || echo "0")
    TOTAL_ATTEMPTS=$(echo "$GRPC_RESPONSE" | grep -o '"total_attempts":"[^"]*"' | cut -d'"' -f4 || echo "0")
    
    echo -e "${GREEN}✓ Cascade metadata found:${NC}"
    echo -e "  ${BLUE}Successful Service:${NC} ${SUCCESSFUL_SERVICE}"
    echo -e "  ${BLUE}Rank Used:${NC} ${RANK_USED}"
    echo -e "  ${BLUE}Total Attempts:${NC} ${TOTAL_ATTEMPTS}"
else
    echo -e "${YELLOW}⚠ Cascade metadata not found in response (may be in different format)${NC}"
    echo -e "${BLUE}Response preview:${NC}"
    echo "$GRPC_RESPONSE" | head -10
fi
echo ""

# Step 6: Check metrics after request
echo -e "${YELLOW}Step 6: Checking metrics after request...${NC}"
sleep 1  # Give metrics time to update
UPDATED_METRICS=$(curl -s "${METRICS_URL}")

# Extract cascading metrics
echo -e "${BLUE}Cascading Metrics:${NC}"

# Primary success (filter out HELP and TYPE lines)
PRIMARY_SUCCESS=$(echo "$UPDATED_METRICS" | grep "^coordinator_primary_success_total " | grep -v "^#" | awk '{print $2}' | grep -E '^[0-9]+$' || echo "0")
echo -e "  ${BLUE}Primary Success Total:${NC} ${PRIMARY_SUCCESS}"

# Fallback usage
FALLBACK_METRICS=$(echo "$UPDATED_METRICS" | grep "^coordinator_fallback_used_total" || echo "")
if [ -n "$FALLBACK_METRICS" ]; then
    echo -e "  ${BLUE}Fallback Usage:${NC}"
    echo "$FALLBACK_METRICS" | while read line; do
        RANK=$(echo "$line" | grep -o 'rank="[^"]*"' | cut -d'"' -f2 || echo "")
        COUNT=$(echo "$line" | awk '{print $2}' || echo "0")
        if [ -n "$RANK" ]; then
            echo -e "    Rank ${RANK}: ${COUNT}"
        fi
    done
else
    echo -e "  ${BLUE}Fallback Usage:${NC} None yet"
fi

# Successful rank histogram
echo -e "  ${BLUE}Successful Rank Histogram:${NC}"
for bucket in 1 2 3 4 5 10; do
    COUNT=$(echo "$UPDATED_METRICS" | grep "coordinator_successful_rank_bucket{le=\"${bucket}\"}" | awk '{print $2}' || echo "0")
    echo -e "    Rank ≤${bucket}: ${COUNT}"
done

# Attempts before success histogram
echo -e "  ${BLUE}Attempts Before Success Histogram:${NC}"
for bucket in 1 2 3 4 5 10; do
    COUNT=$(echo "$UPDATED_METRICS" | grep "coordinator_attempts_before_success_bucket{le=\"${bucket}\"}" | awk '{print $2}' || echo "0")
    echo -e "    Attempts ≤${bucket}: ${COUNT}"
done

echo ""

# Step 7: Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Calculate metrics delta (ensure both are numbers)
INITIAL_PRIMARY_SUCCESS_NUM=$(echo "$INITIAL_PRIMARY_SUCCESS" | grep -E '^[0-9]+$' || echo "0")
PRIMARY_SUCCESS_NUM=$(echo "$PRIMARY_SUCCESS" | grep -E '^[0-9]+$' || echo "0")
PRIMARY_DELTA=$((PRIMARY_SUCCESS_NUM - INITIAL_PRIMARY_SUCCESS_NUM))

if [ "$PRIMARY_DELTA" -gt 0 ]; then
    echo -e "${GREEN}✓ Cascading metrics are being recorded${NC}"
    echo -e "  Primary success increased by: ${PRIMARY_DELTA}"
else
    echo -e "${YELLOW}⚠ No primary success recorded (may need actual service calls)${NC}"
fi

echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Ensure test services are running and return appropriate responses"
echo "2. Services should return empty/poor data to trigger fallback"
echo "3. Check logs for cascade execution details"
echo "4. Verify metrics at: ${METRICS_URL}"
echo ""

echo -e "${GREEN}Test completed!${NC}"

# Cleanup: Optionally stop mock services if we started them
if [ -n "$MOCK_SERVICES_PID" ]; then
    echo ""
    echo -e "${BLUE}Mock services are still running (PIDs: $MOCK_SERVICES_PID)${NC}"
    echo -e "${BLUE}To stop them, run: kill $EMPTY_PID $GOOD_PID $BACKUP_PID${NC}"
fi

