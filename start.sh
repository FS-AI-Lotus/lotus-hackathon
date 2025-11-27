#!/usr/bin/env bash
set -euo pipefail

# Ensure we run the Coordinator service inside the monorepo
cd lotus-hackathon-main/services/coordinator

# Install dependencies (prefer clean CI install if available)
if command -v npm >/dev/null 2>&1; then
	npm ci || npm install
fi

# Start the coordinator (respects PORT from environment)
exec npm run start
