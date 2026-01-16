# Security Overview

## Purpose
Document the current security posture, controls, and known gaps.

## Audience
Engineers, security reviewers, and operators.

## Prerequisites
Familiarity with the backend API and blockchain service.

## Controls Observed in Code
- **HTTP security headers** via Helmet.
- **CORS** enabled in backend and blockchain services.
- **Rate limiting** in backend and blockchain services.
- **Authentication** via wallet signature challenge/response.

## Known Gaps / To Verify
- Session storage is in-memory; verify if persistence is planned for production.
- Confirm whether additional rate limits are needed on auth challenge endpoints.
- Validate how secrets are managed in deployed environments (e.g., OCI, Docker).

## Verification Steps
- Review backend middleware configuration.
- Exercise auth endpoints and check session handling.
- Inspect deployment configuration for secret management.

## Last Verified
Unknown / To verify. Validate current rate limit settings and auth session storage.
