🚀 Lotus Hackathon – Platform Monorepo
Coordinator • Microservices • CI/CD • Docker • Infrastructure • Monitoring

This repository contains the entire Lotus Hackathon platform, including:

- Coordinator microservice

- Multiple microservices

- CI/CD pipelines

- Docker builds

- Smoke testing system

- (Future) Terraform infrastructure

- (Future) Monitoring & Security tools

All teams collaborate inside this single monorepo to deliver one unified system.

📁 Repository Structure
repo/
├── services/
│   ├── coordinator/
│   │   ├── server.js
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   │
│   ├── ms1/
│   │   ├── server.js
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   │
│   └── ms2/ (optional)
│       ├── server.js
│       ├── package.json
│       ├── Dockerfile
│       └── .dockerignore
│
├── scripts/
│   ├── smoke-tests.sh
│   ├── smoke-tests.js
│   └── test-register.js
│
└── .github/
    └── workflows/
        ├── coordinator-ci.yml
        ├── microservices-ci.yml
        ├── pr-checks.yml
        └── docker-build.yml (optional)

🔥 Project Overview

The Lotus platform is a cloud-native, multi-service system designed to showcase:

AI-powered routing

Dynamic microservice registration

Schema validation

Centralized UI/UX configuration

Deployment automation

Monitoring and observability

All infrastructure and services deploy to Railway.

The repository is intentionally structured as a monorepo to simplify:

CI/CD

Code sharing

Team collaboration

Container builds

Deployment workflows

👥 Team Responsibilities
🟦 Team 1 – Terraform (Infrastructure)

Goal: One command deploys the entire system.

Deliverables:

Terraform configuration for:

Railway project

Coordinator service

Microservices

Environment IDs

Automatic outputs: URLs, ENV IDs, credentials

Reproducible infra:

terraform apply → full system deployed

🟩 Team 2 – CI/CD (THIS TEAM)

Goal: Fully automated build + deploy pipelines for all services.

Deliverables:

GitHub Actions workflows:

Build → Test → Docker Build → Deploy → Smoke Tests

Every push to main automatically deploys to Railway

Live smoke tests for:

/health

/register

Build logs and preview builds for feature branches

Reusable workflows for all teams

Documentation of required secrets

Technologies:

GitHub Actions

Railway CLI

Docker

Node.js smoke tests

🟥 Team 3 – Coordinator & Microservices

Deliverables:

Coordinator service

/register endpoint

/route AI-based routing

Schema registry & validation

UI/UX configuration endpoint (/ui-settings)

Prometheus metrics

Logging (Winston/Pino)

Dockerfiles for each service

🟨 Team 4 – Monitoring & Security

Deliverables:

Prometheus scraping for all services

Grafana dashboards (requests/sec, latency, errors, uptime)

JWT or mTLS authentication between services

Rate limiting, input validation, security protections

Alerts for failures and routing errors

🐳 Docker Support
