# Environments & Deployment Options

## Purpose
Describe supported deployment options and environment expectations for the Lomen Club platform.

## Audience
Engineers and operators preparing deployments.

## Prerequisites
- Access to the target environment (OCI or other hosting provider).
- OCI CLI configured if using OCI scripts.

## Deployment Options in Repo

### 1) OCI Object Storage (Static Frontend)
The repository includes `deploy-to-oci.sh`, which builds the frontend and uploads the `dist/` output to OCI Object Storage.

**Key steps performed by the script:**
- Builds the React app (`npm run build`).
- Creates an OCI bucket (if not present).
- Uploads files to the bucket and enables static website hosting.

### 2) OCI Container Instance (Docker)
The repository includes `deploy-oci-container.sh`, which builds a Docker image from `docker/Dockerfile` and deploys it as an OCI Container Instance.

**Key steps performed by the script:**
- Builds a Docker image using `docker/Dockerfile`.
- Pushes the image to OCI Container Registry.
- Creates a Container Instance using OCI CLI.

## Environment Variables
- `MONGODB_URI`, `KCC_RPC_URL`, and related settings are defined in `.env.example`.
- Backend defaults to `PORT=3002` and blockchain defaults to `BLOCKCHAIN_PORT=3003` unless overridden.

## Unknown / To Verify
- Which deployment option is currently used for production.
- Whether the backend and blockchain services are deployed separately from the frontend.

## Verification Steps
- Confirm which script is used for production deployment.
- Validate environment variable values in the target environment.

## Last Verified
Unknown / To verify. Validate OCI scripts and current deployment topology.
