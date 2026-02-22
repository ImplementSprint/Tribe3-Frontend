# Proposed Developer Workflow

This document proposes a standard day-to-day workflow for developers working in this repository.

## 1) Scope

- Applies to FE Single and FE Multi pipeline setups.
- Covers branch flow, pull request expectations, CI/CD gates, and release promotion.
- Aligns with current automation in GitHub Actions + Vercel + SonarCloud.

## 2) Branch Strategy

- Main promotion path: `feature/*` → `test` → `uat` → `main`
- Do not commit directly to `test`, `uat`, or `main`.
- Use short-lived feature branches:
  - `feature/<ticket>-<short-description>`
  - example: `feature/t3-142-user-profile-header`

## 3) Daily Developer Loop

1. Sync with latest integration branch.
   - `git checkout test`
   - `git pull origin test`
2. Create/update feature branch.
   - `git checkout -b feature/<name>` (or continue existing)
3. Build incrementally and commit using Conventional Commits.
   - `feat: ...`, `fix: ...`, `chore: ...`, `refactor: ...`, `test: ...`
4. Push branch and open PR to `test`.
5. Address CI feedback until all required checks pass.
6. Request peer review (self-approval is not allowed).

## 4) Pull Request Requirements

- At least 1 peer review approval.
- All required status checks must pass.
- No lint errors.
- Test pass rate 100%.
- Coverage threshold met (>= 80% where enforced).
- SonarCloud Quality Gate passes (where configured).
- No critical/high dependency vulnerabilities.
- No hardcoded secrets.

## 5) CI/CD Behavior by Branch

### `test`

- Runs frontend checks and configured quality gates.
- Creates version tag(s):
  - FE Single: global stream (`test-v*`).
  - FE Multi: per-system streams (`test-<system>-v*`).
- Deploys preview URLs in Vercel.
- Auto-creates promotion PR `test → uat` with:
  - deployment links
  - release summary
  - quality gate status

### `uat`

- Runs checks + preview deploy.
- Auto-creates promotion PR `uat → main` with deployment evidence.

### `main`

- Runs production readiness checks.
- Deploys production in Vercel.
- Updates repository About homepage URL to production URL.
- Creates main release tag(s):
  - FE Single: global stream (`main-v*`).
  - FE Multi: per-system streams (`main-<system>-v*`).
- Builds and pushes GHCR image(s).

## 6) Notifications and Visibility

- Slack and Discord notifications are sent for success/failure/cancelled runs.
- Notifications include environment, branch, compare link, deployment link(s), and run URL.
- Optional image URLs can be configured using repo variables:
  - `DISCORD_SUCCESS_IMAGE_URL` (or `DISCORD_SUCCESS`)
  - `DISCORD_FAIL_IMAGE_URL` (or `DISCORD_FAIL`)
  - `DISCORD_CANCELLED_IMAGE_URL` (or `DISCORD_CANCELLED`)

## 7) API Governance (Cross-Tribe)

- No direct database access across tribes; integration must go through API Center/Gateway.
- All APIs must be documented and aligned with central OpenAPI/Swagger standards.
- Version every API path (`/v1`, `/v2`) to avoid breaking consumers.

### Naming Convention

- Shared APIs: `apicenter-shared-<domain>-api`
- Tribe-owned APIs: `tribe<id>-<domain>-api`

### URL Path Convention

- Shared: `/api/shared/{domain}/v{major}/...`
- Tribe-owned: `/api/tribe{n}/{domain}/v{major}/...`

## 8) Failure Policy

- If CI or E2E fails, do not force merge.
- Fix forward immediately; if not possible, revert safely.
- Auto-revert is enabled for failed push pipelines (with skip markers support).

## 9) Team Operating Rules

- Keep PRs small and focused.
- Pull from `test` frequently to reduce conflicts.
- Add clear PR descriptions with risk, testing notes, and affected systems.
- For breaking changes, coordinate migration plan before introducing new API major version.

## 10) Recommended Definition of Done

A task is done only when:

- Code is merged through PR with approval.
- Required checks pass.
- Deployment evidence is present for target environment.
- Monitoring/notification confirms healthy deployment.
- Documentation/config updates are included when behavior changes.
