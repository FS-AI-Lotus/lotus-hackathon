#!/bin/bash

echo "Stopping all mock services..."

# Find and kill processes on ports 4001, 4002, 4003
for port in 4001 4002 4003; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "Killing process on port $port (PID: $PID)"
        kill -9 $PID 2>/dev/null
    fi
done

# Also kill by process name
pkill -f "empty-service.js" 2>/dev/null
pkill -f "good-service.js" 2>/dev/null
pkill -f "backup-service.js" 2>/dev/null

sleep 1
echo "All mock services stopped"

