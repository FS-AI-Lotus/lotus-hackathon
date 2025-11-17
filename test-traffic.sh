#!/bin/bash

# Test Traffic Generator for Team 4 Monitoring
# Generates various types of requests to test metrics collection

echo "🚀 Generating test traffic for monitoring verification..."
echo ""

# Health checks
echo "1️⃣  Health checks (20 requests)..."
for i in {1..20}; do
    curl -s http://localhost:3000/health > /dev/null
    sleep 0.1
done
echo "   ✅ Health checks completed"

# Service registrations
echo ""
echo "2️⃣  Service registrations (5 success, 2 failures)..."
for i in {1..5}; do
    curl -s -X POST http://localhost:3000/register \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"service-$i\",\"url\":\"http://localhost:$((3000 + i))\"}" > /dev/null
    sleep 0.2
done

# Failed registrations
curl -s -X POST http://localhost:3000/register \
    -H "Content-Type: application/json" \
    -d '{"name":""}' > /dev/null

curl -s -X POST http://localhost:3000/register \
    -H "Content-Type: application/json" \
    -d '{"name":"invalid","url":"not-a-url"}' > /dev/null

echo "   ✅ Service registrations completed"

# Routing operations
echo ""
echo "3️⃣  Routing operations (10 success, 3 failures)..."
for i in {1..10}; do
    curl -s -X POST http://localhost:3000/route \
        -H "Content-Type: application/json" \
        -d "{\"origin\":\"client-$i\",\"destination\":\"service-1\",\"data\":{\"key\":\"value-$i\"}}" > /dev/null
    sleep 0.15
done

# Failed routing (non-existent destination)
for i in {1..3}; do
    curl -s -X POST http://localhost:3000/route \
        -H "Content-Type: application/json" \
        -d "{\"origin\":\"client\",\"destination\":\"nonexistent-$i\",\"data\":{\"key\":\"value\"}}" > /dev/null
    sleep 0.15
done

echo "   ✅ Routing operations completed"

# Error requests
echo ""
echo "4️⃣  Error requests (5 requests)..."
for i in {1..5}; do
    curl -s http://localhost:3000/error > /dev/null
    sleep 0.2
done
echo "   ✅ Error requests completed"

# Mixed traffic
echo ""
echo "5️⃣  Mixed traffic (30 requests)..."
for i in {1..30}; do
    case $((i % 4)) in
        0) curl -s http://localhost:3000/health > /dev/null ;;
        1) curl -s http://localhost:3000/test > /dev/null ;;
        2) curl -s http://localhost:3000/services > /dev/null ;;
        3) curl -s http://localhost:3000/metrics > /dev/null ;;
    esac
    sleep 0.1
done
echo "   ✅ Mixed traffic completed"

echo ""
echo "✅ Test traffic generation complete!"
echo ""
echo "📊 Next steps:"
echo "   1. Check Prometheus: http://localhost:9090"
echo "   2. Check Grafana: http://localhost:3001"
echo "   3. Verify all dashboard panels show data"
echo ""

