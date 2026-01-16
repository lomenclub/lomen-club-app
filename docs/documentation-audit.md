# Documentation Audit

## Purpose
Inventory existing documentation, assess quality, and map content to the new documentation structure.

## Audience
Project maintainers and documentation owners.

## Prerequisites
None.

## Inventory
| Path | Description | Status |
| --- | --- | --- |
| `README.md` | Repository overview and quickstart. | Keep (rewritten) |
| `docs/index.md` | Documentation index and navigation. | Keep (new) |
| `docs/overview.md` | System overview and glossary. | Keep (new) |
| `docs/architecture/architecture.md` | C4-style architecture summary. | Keep (new) |
| `docs/architecture/data-flow.md` | Data flow documentation. | Keep (new) |
| `docs/architecture/security.md` | Security overview. | Keep (new) |
| `docs/architecture/adr/README.md` | ADR process guide. | Keep (new) |
| `docs/architecture/adr/0001-adr-template.md` | ADR template. | Keep (new) |
| `docs/getting-started/prerequisites.md` | Setup prerequisites. | Keep (new) |
| `docs/getting-started/local-development.md` | Local dev instructions. | Keep (new) |
| `docs/getting-started/testing.md` | Testing and QA guidance. | Keep (new) |
| `docs/deployment/environments.md` | Deployment options and environment guidance. | Keep (new) |
| `docs/deployment/ci-cd.md` | CI/CD status. | Keep (new) |
| `docs/deployment/release-process.md` | Release process (to verify). | Keep (new) |
| `docs/operations/runbooks.md` | Operational runbooks. | Keep (new) |
| `docs/operations/monitoring-logging.md` | Monitoring/logging guidance. | Keep (new) |
| `docs/operations/troubleshooting.md` | Known issues and troubleshooting. | Keep (new) |
| `docs/operations/qa-repros/*.md` | QA reproduction reports. | Keep (migrated) |
| `docs/operations/qa-fix-plans/*.md` | QA fix plans. | Keep (migrated) |
| `docs/api/api-overview.md` | API overview. | Keep (new) |
| `docs/contributing/contributing.md` | Contribution guidelines. | Keep (new) |
| `docs/contributing/coding-standards.md` | Coding standards. | Keep (new) |
| `wordpress-theme-lomen-club/README.md` | WordPress theme docs. | Keep (updated) |

## Removed / Deprecated
| Path | Action | Replacement |
| --- | --- | --- |
| `apps/frontend/src/config/README.md` | Removed duplicate; content migrated. | `docs/getting-started/local-development.md` |
| `src/config/README.md` | Removed duplicate; content migrated. | `docs/getting-started/local-development.md` |

## Contradictions & Duplications
- Two frontend codebases exist (`/src` at repo root and `apps/frontend/src`). Both have their own `package.json` and Vite configs.
- There are no root-level workspace scripts to run backend/blockchain services; commands must be run in each package directory.
- Docker Compose includes Redis, but there are no Redis imports in application packages, suggesting it is optional or legacy.

## Missing Critical Docs
- Verified CI/CD pipeline documentation.
- Clear production deployment topology (which services are deployed, where, and how they connect).
- Runbook for database migrations beyond available scripts.

## Last Verified
Unknown / To verify. Validate the canonical frontend, deployment topology, and CI/CD ownership.
