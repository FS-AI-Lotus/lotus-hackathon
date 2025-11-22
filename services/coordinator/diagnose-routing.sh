#!/bin/bash

# Diagnostic script for AI routing issues
# This script checks all aspects of the routing system

set -e

COORDINATOR_URL="http://localhost:3000"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AI Routing Diagnostic Tool${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check Coordinator health
echo -e "${YELLOW}Step 1: Checking Coordinator health...${NC}"
if curl -s -f "${COORDINATOR_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Coordinator is running${NC}"
else
    echo -e "${RED}✗ Coordinator is not running${NC}"
    exit 1
fi
echo ""

# Step 2: Check registered services
echo -e "${YELLOW}Step 2: Checking registered services...${NC}"
SERVICES_JSON=$(curl -s "${COORDINATOR_URL}/api/services")
ACTIVE_COUNT=$(echo "$SERVICES_JSON" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len([s for s in data.get('availableServices', []) if s.get('status') == 'active']))" 2>/dev/null || echo "0")
TOTAL_COUNT=$(echo "$SERVICES_JSON" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('availableServices', [])))" 2>/dev/null || echo "0")

echo -e "${BLUE}Total services: ${TOTAL_COUNT}${NC}"
echo -e "${BLUE}Active services: ${ACTIVE_COUNT}${NC}"

# Check for test services
TEST_SERVICES=$(echo "$SERVICES_JSON" | python3 -c "import sys, json; data=json.load(sys.stdin); services = [s for s in data.get('availableServices', []) if 'test' in s.get('serviceName', '').lower()]; print('\\n'.join([f\"  - {s['serviceName']} (status: {s.get('status', 'unknown')}, endpoint: {s.get('endpoint', 'none')})\" for s in services]))" 2>/dev/null || echo "  (none)")

if [ -n "$TEST_SERVICES" ] && [ "$TEST_SERVICES" != "  (none)" ]; then
    echo -e "${GREEN}✓ Test services found:${NC}"
    echo "$TEST_SERVICES"
else
    echo -e "${YELLOW}⚠ No test services found${NC}"
fi
echo ""

# Step 3: Check OpenAI configuration
echo -e "${YELLOW}Step 3: Checking OpenAI configuration...${NC}"
if [ -f ".env" ]; then
    if grep -q "OPENAI_API_KEY=" .env && ! grep -q "OPENAI_API_KEY=$" .env && ! grep -q "^OPENAI_API_KEY= *$" .env; then
        echo -e "${GREEN}✓ OPENAI_API_KEY is set in .env${NC}"
    else
        echo -e "${RED}✗ OPENAI_API_KEY is not set or empty in .env${NC}"
    fi
    
    if grep -q "AI_ROUTING_ENABLED=true" .env; then
        echo -e "${GREEN}✓ AI_ROUTING_ENABLED=true${NC}"
    else
        echo -e "${YELLOW}⚠ AI_ROUTING_ENABLED is not set to 'true'${NC}"
    fi
else
    echo -e "${YELLOW}⚠ .env file not found${NC}"
fi
echo ""

# Step 4: Test AI routing with simple query
echo -e "${YELLOW}Step 4: Testing AI routing with simple query...${NC}"
ROUTING_RESPONSE=$(curl -s -X POST "${COORDINATOR_URL}/api/route" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "test query"
    }')

ROUTING_SUCCESS=$(echo "$ROUTING_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print('true' if data.get('success') else 'false')" 2>/dev/null || echo "false")
RANKED_COUNT=$(echo "$ROUTING_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); routing = data.get('routing', {}); ranked = routing.get('rankedServices', routing.get('targetServices', [])); print(len(ranked) if isinstance(ranked, list) else 0)" 2>/dev/null || echo "0")

if [ "$ROUTING_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✓ Routing request succeeded${NC}"
    echo -e "${BLUE}  Ranked services count: ${RANKED_COUNT}${NC}"
    
    if [ "$RANKED_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ Found ${RANKED_COUNT} ranked services${NC}"
        
        # Show first few services
        echo "$ROUTING_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); routing = data.get('routing', {}); ranked = routing.get('rankedServices', routing.get('targetServices', [])); [print(f\"  {i+1}. {s.get('serviceName', 'unknown')} (confidence: {s.get('confidence', 0):.2f})\") for i, s in enumerate(ranked[:5])]" 2>/dev/null || true
    else
        echo -e "${RED}✗ No ranked services returned${NC}"
    fi
else
    echo -e "${RED}✗ Routing request failed${NC}"
    ERROR_MSG=$(echo "$ROUTING_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('message', 'Unknown error'))" 2>/dev/null || echo "Unknown error")
    echo -e "${RED}  Error: ${ERROR_MSG}${NC}"
fi
echo ""

# Step 5: Test with gRPC query (if grpcurl is available)
echo -e "${YELLOW}Step 5: Testing gRPC routing...${NC}"
if command -v grpcurl >/dev/null 2>&1; then
    export PATH="$HOME/.local/bin:$PATH"
    
    PROTO_PATH="./src/grpc/proto"
    if [ -f "${PROTO_PATH}/coordinator.proto" ]; then
        GRPC_RESPONSE=$(grpcurl -plaintext -proto "${PROTO_PATH}/coordinator.proto" -d '{
            "tenant_id": "test-tenant",
            "user_id": "test-user",
            "query_text": "test query",
            "metadata": {
                "test": "diagnostic"
            }
        }' "localhost:50051" rag.v1.CoordinatorService/Route 2>&1) || true
        
        if echo "$GRPC_RESPONSE" | grep -q "successful_service\|rank_used"; then
            echo -e "${GREEN}✓ gRPC routing succeeded${NC}"
            echo "$GRPC_RESPONSE" | grep -E "successful_service|rank_used|total_attempts" | head -5 || true
        else
            echo -e "${YELLOW}⚠ gRPC routing may have failed${NC}"
            echo "$GRPC_RESPONSE" | head -10
        fi
    else
        echo -e "${YELLOW}⚠ Proto file not found at ${PROTO_PATH}/coordinator.proto${NC}"
    fi
else
    echo -e "${YELLOW}⚠ grpcurl not installed, skipping gRPC test${NC}"
fi
echo ""

# Step 6: Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Diagnostic Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Active services: ${ACTIVE_COUNT}"
echo -e "Routing test: ${ROUTING_SUCCESS}"
echo -e "Ranked services: ${RANKED_COUNT}"

if [ "$ROUTING_SUCCESS" = "true" ] && [ "$RANKED_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ System appears to be working correctly${NC}"
elif [ "$ACTIVE_COUNT" -eq 0 ]; then
    echo -e "${RED}✗ No active services registered${NC}"
    echo -e "${YELLOW}  → Register services first${NC}"
elif [ "$RANKED_COUNT" -eq 0 ]; then
    echo -e "${RED}✗ Routing is not finding services${NC}"
    echo -e "${YELLOW}  → Check AI configuration and service capabilities${NC}"
else
    echo -e "${YELLOW}⚠ System may have issues${NC}"
fi

