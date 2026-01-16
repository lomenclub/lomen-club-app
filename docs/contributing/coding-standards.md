# Coding Standards

## Purpose
Set baseline coding conventions for the Lomen Club codebase.

## Audience
Engineers contributing code.

## Prerequisites
None.

## Language & Tooling
- TypeScript is used across frontend and backend packages.
- ESLint is configured at the repository root.

## General Guidelines
- Prefer clear, typed interfaces over `any`.
- Keep modules focused and avoid duplicating logic between services.
- Log meaningful errors and include context for operational debugging.

## Linting
Run linting in the package you change:
```bash
cd apps/backend && npm run lint
cd apps/frontend && npm run lint
cd packages/shared && npm run lint
```

## Documentation
When you change behavior, update relevant docs and adjust "Last Verified" sections.

## Last Verified
Unknown / To verify. Confirm lint rules and align with team conventions.
