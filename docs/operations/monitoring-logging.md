# Monitoring & Logging

## Purpose
Describe how to observe service health, logs, and basic monitoring points.

## Audience
Operators and engineers troubleshooting runtime issues.

## Prerequisites
- Services running locally or in a target environment.

## Logging
- **Backend** and **blockchain service** use `morgan('combined')` and log to stdout.
- Docker containers (KCC node, Redis) log to Docker's logging driver.

## Health Endpoints
- **Backend**: `/api/health`
- **Blockchain Service**: `/api/health`

## Basic Checks
```bash
# Backend health
curl http://localhost:3002/api/health

# Blockchain health
curl http://localhost:3003/api/health
```

## Docker Logs
```bash
# KCC node logs
docker logs lomen-kcc-node

# Redis logs
docker logs lomen-redis-cache
```

## Last Verified
Unknown / To verify. Confirm port mappings and health endpoints in the current environment.
