#!/bin/bash

echo "Starting mock services..."

node empty-service.js &
EMPTY_PID=$!
echo "Empty service started (PID: $EMPTY_PID)"

node good-service.js &
GOOD_PID=$!
echo "Good service started (PID: $GOOD_PID)"

node backup-service.js &
BACKUP_PID=$!
echo "Backup service started (PID: $BACKUP_PID)"

echo ""
echo "All mock services running!"
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $EMPTY_PID $GOOD_PID $BACKUP_PID; exit" INT
wait

