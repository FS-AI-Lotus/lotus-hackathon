FROM node:20-alpine

# Set workdir to the coordinator service
WORKDIR /app/lotus-hackathon-main/services/coordinator

# Install dependencies first (better layer caching)
COPY lotus-hackathon-main/services/coordinator/package*.json ./
RUN npm ci --omit=dev || npm install --production

# Copy coordinator service source
COPY lotus-hackathon-main/services/coordinator ./

# Copy UI config directory so coordinator can read ../../ui/ui-ux-config.json
WORKDIR /app/lotus-hackathon-main
COPY lotus-hackathon-main/ui ./ui

# Back to coordinator
WORKDIR /app/lotus-hackathon-main/services/coordinator

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/index.js"]


