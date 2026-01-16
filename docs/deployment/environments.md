# Environments & Deployment Options

## Purpose
Describe supported deployment options and environment expectations for the Lomen Club platform.

## Audience
Engineers and operators preparing deployments.

## Prerequisites
- Access to the target environment (hosting provider or infrastructure platform).

## Deployment Options in Repo
The repository no longer includes deployment scripts at the root. Deployment options should be defined by the team and documented here once confirmed.

## Environment Variables
- `MONGODB_URI`, `KCC_RPC_URL`, and related settings are defined in `.env.example`.
- Backend defaults to `PORT=3002` and blockchain defaults to `BLOCKCHAIN_PORT=3003` unless overridden.

## Unknown / To Verify
- Which deployment option is currently used for production.
- Whether the backend and blockchain services are deployed separately from the frontend.
- How container images (if any) are built and released.

## Verification Steps
- Confirm which pipeline or procedure is used for production deployment.
- Validate environment variable values in the target environment.

## Last Verified
Unknown / To verify. Validate current deployment topology and deployment tooling.
