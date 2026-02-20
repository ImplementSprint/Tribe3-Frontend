# Repository Setup Guide — CI/CD Pipeline

> **How to set up any new tribe repository so the CI/CD pipeline runs successfully.**
> All new frontend projects must use **Next.js (TypeScript-only)**. Backend projects must use **NestJS (TypeScript-only)**. Mobile projects use **React Native**.

---

## Table of Contents

1. [GitHub Secrets (Required)](#1-github-secrets-required)
2. [Branching Strategy](#2-branching-strategy)
3. [Single-System Frontend Repo](#3-single-system-frontend-repo)
4. [Multi-System Frontend Monorepo](#4-multi-system-frontend-monorepo)
5. [Single-System Backend Repo](#5-single-system-backend-repo)
6. [Single-System Mobile Repo](#6-single-system-mobile-repo)
7. [Required Files per System](#7-required-files-per-system)
8. [Workflow Files to Copy](#8-workflow-files-to-copy)
9. [Quick Checklist](#9-quick-checklist)
7. [Quick Checklist](#7-quick-checklist)

---

## 1. GitHub Secrets (Required)

Go to **Settings → Secrets and variables → Actions** in the GitHub repo and add:

| Secret               | Description                                  | Example                                   |
|----------------------|----------------------------------------------|-------------------------------------------|
| `SONAR_TOKEN`        | SonarCloud authentication token              | *(from sonarcloud.io)*                    |
| `SONAR_PROJECT_KEY`  | SonarCloud project key                       | `ImplementSprint_TriniThrive-Frontend`    |
| `SONAR_ORGANIZATION` | SonarCloud organization key                  | `implementsprint`                         |

> **Tip:** For org-wide secrets (`SONAR_ORGANIZATION`, `SONAR_TOKEN`), set them at the **GitHub Organization level** so all tribe repos inherit them automatically.

> **Monorepos:** One `SONAR_PROJECT_KEY` per repo — the single scan covers all subdirectories.

---

## 2. Branching Strategy

Every repo uses **3 long-lived branches** with **PR-based promotion**:

```
  feature branch     test branch        uat branch          main branch
  ──────────────     ─────────────      ──────────────      ──────────────
  Development        CI only            CI + Deploy UAT     CI + Prod Gate
  (local work,       (tests, lint,      (same as test,      + Deploy Prod
   PR → test)        security,          PLUS deploy to
                     sonar, build)      UAT environment)

  Push flow:   feature ──PR──▶ test ──auto──▶ uat ──auto──▶ main
                        manual          ↑                    ↑
                                   auto-promote         auto-promote
                                   (CI passes)       (CI + deploy passes)
```

| Branch | What Runs | Deploy? | Auto-Promote? | Manual Step? |
|--------|-----------|---------|---------------|-------------|
| `test` | Tests + Lint + Security + SonarCloud + Build | No | → `uat` after CI passes | PR from feature |
| `uat`  | All CI + Deploy to UAT environment | Yes (UAT) | → `main` after CI + deploy | None |
| `main` | All CI + Production Gate + Deploy to Prod | Yes (Prod) | — (final) | Production gate approval |

> **Only 2 manual steps in the entire flow:** (1) Creating/merging the PR to `test`, and (2) approving the production gate on `main`.

### Setup

```bash
# Create the 3 branches
git checkout -b test
git push -u origin test

git checkout -b uat
git push -u origin uat

# main already exists as default branch
```

In GitHub → **Settings → Environments**:
- Create `uat` environment
- Create `production` environment → add **required reviewers** for approval gate

In GitHub → **Settings → Branches**:
- Add branch protection for `test` (require PR, require status checks to pass)
- Add branch protection for `uat` and `main` (require PR + required status checks)

> **Important:** Promotion is PR-based (`test → uat` and `uat → main`). Keep direct pushes to protected branches blocked.

### Developer Workflow

1. Dev creates `feature/my-feature` from `test`
2. Dev pushes commits, opens PR → `test`
3. CI runs on the PR — reviewer sees green/red checks
4. Merge to `test` — CI runs + TEST deploy happens per system
5. Pipeline auto-creates PR: `test → uat` (manual merge)
6. Merge to `uat` — CI + UAT deploy runs
7. Pipeline auto-creates PR: `uat → main` (manual merge)
8. Main pipeline runs (CI) → **Production Gate (manual approval)** → deploys to production

### Developer Workflow

1. Dev creates `feature/my-feature` from `test`
2. Dev pushes commits, opens PR → `test`
3. CI runs on the PR — reviewer sees green/red checks
4. Merge to `test` — CI runs + TEST deploy happens per system
5. Pipeline auto-creates PR: `test → uat` (manual merge)
6. Merge to `uat` — CI + UAT deploy runs
7. Pipeline auto-creates PR: `uat → main` (manual merge)
8. Main pipeline runs (CI) → **Production Gate (manual approval)** → deploys to production

---

## 3. Single-System Frontend Repo

> All new frontend projects must use **Next.js with TypeScript** (App Router recommended).

**Example:** `BluesClues-Frontend` with one system called `PadyakPH-Web`

### Folder Structure

```
BluesClues-Frontend/
├── .github/
│   └── workflows/
│       ├── master-pipeline.yml        ← orchestrator (YOU CREATE THIS)
│       ├── front-end-workflow.yml      ← reusable (COPY FROM TEMPLATE)
│       ├── frontend-tests.yml          ← reusable (COPY)
│       ├── lint-check.yml              ← reusable (COPY)
│       ├── security-scan.yml           ← reusable (COPY)
│       ├── deploy-staging.yml          ← reusable (COPY)
│       └── production-gate.yml         ← reusable (COPY)
├── src/
│   ├── App.jsx
│   └── main.jsx
├── tests/
│   └── ui.test.js
├── package.json                        ← with correct scripts + deps
├── package-lock.json                   ← REQUIRED (npm ci needs this)
├── next.config.js
├── eslint.config.js                    ← ESLint flat config
├── sonar-project.properties            ← SonarCloud config
└── app/
  └── page.jsx
```

### master-pipeline.yml (Single System)

```yaml
name: "Master Pipeline Orchestrator"

on:
  push:
    branches: [test, uat, prod]
  pull_request:
    branches: [test, uat, prod]

permissions:
  contents: read
  packages: write
  pull-requests: write

concurrency:
  group: pipeline-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ── Stage 1: CI (all branches) ──
  frontend:
    name: "PadyakPH-Web Pipeline"
    uses: ./.github/workflows/front-end-workflow.yml
    with:
      system-dir: "."                    # <-- root = "."
      system-name: PadyakPH-Web          # <-- your project name
    secrets: inherit

  # ── Stage 1.5: SonarCloud ──
  sonarcloud:
    name: "SonarCloud Analysis"
    needs: [frontend]
    if: always() && needs.frontend.result != 'cancelled'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/download-artifact@v4
        if: needs.frontend.result == 'success'
        with:
          name: PadyakPH-Web-coverage
          path: coverage
        continue-on-error: true
      - uses: SonarSource/sonarqube-scan-action@v6
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >
            -Dsonar.organization=${{ secrets.SONAR_ORGANIZATION }}
            -Dsonar.projectKey=${{ secrets.SONAR_PROJECT_KEY }}

  # ── Stage 2: Deploy to UAT (uat branch only) ──
  deploy-uat:
    name: "UAT — PadyakPH-Web"
    needs: [frontend]
    if: github.ref == 'refs/heads/uat' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: "."
      system-name: PadyakPH-Web
      app-type: web
      artifact-name: PadyakPH-Web-web-build
      deploy-environment: uat
    secrets: inherit

  # ── Stage 3A: Production Gate (prod branch, BEFORE deploy) ──
  production-gate:
    name: "Production Gate"
    needs: [frontend]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/production-gate.yml
    with:
      system-dir: "."
      app-type: web
    secrets: inherit

  # ── Stage 3B: Deploy to Prod (AFTER gate approval) ──
  deploy-prod:
    name: "Prod — PadyakPH-Web"
    needs: [production-gate]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: "."
      system-name: PadyakPH-Web
      app-type: web
      artifact-name: PadyakPH-Web-web-build
      deploy-environment: prod
    secrets: inherit

  pipeline-summary:
    name: "Pipeline Summary"
    needs: [frontend]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Results
        run: |
          echo "PadyakPH-Web: ${{ needs.frontend.result }}"
          if [[ "${{ needs.frontend.result }}" == "failure" ]]; then exit 1; fi
```

---

## 4. Multi-System Frontend Monorepo

**Example:** `TriniThrive-Frontend` with 3 systems: BayaniHub-Web, DAMAYAN-Web, HopeCard-Web

> When a tribe has **multiple frontend systems**, they live as directories inside **one repository** (not separate repos). Each sub-project must be a standalone Next.js app with its own `package.json`, `next.config.js`, and `app/` directory.

### Folder Structure

```
TriniThrive-Frontend/
├── .github/
│   └── workflows/
│       ├── master-pipeline.yml        ← orchestrator (Template D)
│       └── ... (all reusable workflow files)
├── BayaniHub-Web/
│   ├── app/
│   ├── tests/
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.js
│   ├── eslint.config.js
│   └── next-env.d.ts (if using TypeScript)
├── DAMAYAN-Web/
│   ├── ... (same structure)
├── HopeCard-Web/
│   ├── ... (same structure)
└── sonar-project.properties           ← at REPO ROOT, covers ALL sub-projects
```

### How it differs from single-system

| Feature | Single-System | Multi-System Monorepo |
|---|---|---|
| Project location | Root directory (`"."`) | Subdirectories (`BayaniHub-Web/`, etc.) |
| `system-dir` input | `"."` | Directory name |
| Change detection | Not needed | `dorny/paths-filter` skips unchanged dirs |
| SonarCloud | One scan, one `sonar-project.properties` | One scan covers all dirs, `sonar-project.properties` at repo root |
| Deploys | One per stage | One per sub-project per stage (parallel) |

### master-pipeline.yml (Multi System)

```yaml
name: "Master Pipeline Orchestrator"

on:
  push:
    branches: [test, uat, prod]
  pull_request:
    branches: [test, uat, prod]

permissions:
  contents: read
  packages: write
  pull-requests: write

concurrency:
  group: master-pipeline-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ── Stage 0: Detect which sub-projects changed ──
  detect-changes:
    name: "Detect Changed Projects"
    runs-on: ubuntu-latest
    outputs:
      bayanihub-web: ${{ steps.filter.outputs.bayanihub-web }}
      damayan-web: ${{ steps.filter.outputs.damayan-web }}
      hopecard-web: ${{ steps.filter.outputs.hopecard-web }}
      shared: ${{ steps.filter.outputs.shared }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - id: filter
        uses: dorny/paths-filter@v3
        with:
          filters: |
            bayanihub-web:
              - 'BayaniHub-Web/**'
            damayan-web:
              - 'DAMAYAN-Web/**'
            hopecard-web:
              - 'HopeCard-Web/**'
            shared:
              - '.github/**'
              - 'package.json'
              - 'sonar-project.properties'

  # ── Stage 1: CI — each sub-project runs in parallel ──
  # Only runs if its files changed (or shared files like workflows)
  bayanihub-web:
    name: "BayaniHub-Web Pipeline"
    needs: [detect-changes]
    if: needs.detect-changes.outputs.bayanihub-web == 'true' || needs.detect-changes.outputs.shared == 'true'
    uses: ./.github/workflows/front-end-workflow.yml
    with:
      system-dir: BayaniHub-Web         # <-- subdirectory name
      system-name: BayaniHub-Web
    secrets: inherit

  damayan-web:
    name: "DAMAYAN-Web Pipeline"
    needs: [detect-changes]
    if: needs.detect-changes.outputs.damayan-web == 'true' || needs.detect-changes.outputs.shared == 'true'
    uses: ./.github/workflows/front-end-workflow.yml
    with:
      system-dir: DAMAYAN-Web
      system-name: DAMAYAN-Web
    secrets: inherit

  hopecard-web:
    name: "HopeCard-Web Pipeline"
    needs: [detect-changes]
    if: needs.detect-changes.outputs.hopecard-web == 'true' || needs.detect-changes.outputs.shared == 'true'
    uses: ./.github/workflows/front-end-workflow.yml
    with:
      system-dir: HopeCard-Web
      system-name: HopeCard-Web
    secrets: inherit

  # ── Stage 1.5: SonarCloud (single monorepo scan) ──
  # Downloads coverage from ALL sub-projects, runs ONE analysis
  sonarcloud:
    name: "SonarCloud — Monorepo Analysis"
    needs: [bayanihub-web, damayan-web, hopecard-web]
    if: >-
      always() &&
      needs.bayanihub-web.result != 'cancelled' &&
      needs.damayan-web.result != 'cancelled' &&
      needs.hopecard-web.result != 'cancelled'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/download-artifact@v4
        if: needs.bayanihub-web.result == 'success'
        with:
          name: BayaniHub-Web-coverage
          path: BayaniHub-Web/coverage
        continue-on-error: true
      - uses: actions/download-artifact@v4
        if: needs.damayan-web.result == 'success'
        with:
          name: DAMAYAN-Web-coverage
          path: DAMAYAN-Web/coverage
        continue-on-error: true
      - uses: actions/download-artifact@v4
        if: needs.hopecard-web.result == 'success'
        with:
          name: HopeCard-Web-coverage
          path: HopeCard-Web/coverage
        continue-on-error: true
      - uses: SonarSource/sonarqube-scan-action@v6
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >
            -Dsonar.organization=${{ secrets.SONAR_ORGANIZATION }}
            -Dsonar.projectKey=${{ secrets.SONAR_PROJECT_KEY }}

  # ── Stage 2: Deploy to UAT (uat branch only, parallel) ──
  deploy-uat-bayanihub:
    name: "UAT — BayaniHub-Web"
    needs: [bayanihub-web]
    if: |
      always() &&
      github.ref == 'refs/heads/uat' && github.event_name == 'push' &&
      needs.bayanihub-web.result == 'success'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: BayaniHub-Web
      system-name: BayaniHub-Web
      app-type: web
      artifact-name: BayaniHub-Web-web-build
      deploy-environment: uat
    secrets: inherit

  deploy-uat-damayan:
    name: "UAT — DAMAYAN-Web"
    needs: [damayan-web]
    if: |
      always() &&
      github.ref == 'refs/heads/uat' && github.event_name == 'push' &&
      needs.damayan-web.result == 'success'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: DAMAYAN-Web
      system-name: DAMAYAN-Web
      app-type: web
      artifact-name: DAMAYAN-Web-web-build
      deploy-environment: uat
    secrets: inherit

  deploy-uat-hopecard:
    name: "UAT — HopeCard-Web"
    needs: [hopecard-web]
    if: |
      always() &&
      github.ref == 'refs/heads/uat' && github.event_name == 'push' &&
      needs.hopecard-web.result == 'success'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: HopeCard-Web
      system-name: HopeCard-Web
      app-type: web
      artifact-name: HopeCard-Web-web-build
      deploy-environment: uat
    secrets: inherit

  # ── Stage 3A: Production Gate (prod branch, BEFORE deploy) ──
  production-gate:
    name: "Production Readiness Gate"
    needs: [bayanihub-web, damayan-web, hopecard-web]
    if: >-
      always() &&
      github.ref == 'refs/heads/prod' && github.event_name == 'push' &&
      needs.bayanihub-web.result != 'cancelled' &&
      needs.damayan-web.result != 'cancelled' &&
      needs.hopecard-web.result != 'cancelled'
    uses: ./.github/workflows/production-gate.yml
    with:
      system-dir: Tribe3-Frontend
      app-type: web
    secrets: inherit

  # ── Stage 3B: Deploy to Prod (AFTER gate approval, parallel) ──
  deploy-prod-bayanihub:
    name: "Prod — BayaniHub-Web"
    needs: [production-gate]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: BayaniHub-Web
      system-name: BayaniHub-Web
      app-type: web
      artifact-name: BayaniHub-Web-web-build
      deploy-environment: prod
    secrets: inherit

  deploy-prod-damayan:
    name: "Prod — DAMAYAN-Web"
    needs: [production-gate]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: DAMAYAN-Web
      system-name: DAMAYAN-Web
      app-type: web
      artifact-name: DAMAYAN-Web-web-build
      deploy-environment: prod
    secrets: inherit

  deploy-prod-hopecard:
    name: "Prod — HopeCard-Web"
    needs: [production-gate]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: HopeCard-Web
      system-name: HopeCard-Web
      app-type: web
      artifact-name: HopeCard-Web-web-build
      deploy-environment: prod
    secrets: inherit

  pipeline-summary:
    name: "Pipeline Summary"
    needs: [bayanihub-web, damayan-web, hopecard-web]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Results
        run: |
          echo "BayaniHub-Web: ${{ needs.bayanihub-web.result }}"
          echo "DAMAYAN-Web:   ${{ needs.damayan-web.result }}"
          echo "HopeCard-Web:  ${{ needs.hopecard-web.result }}"
          FAILED=false
          if [[ "${{ needs.bayanihub-web.result }}" == "failure" ]]; then FAILED=true; fi
          if [[ "${{ needs.damayan-web.result }}" == "failure" ]]; then FAILED=true; fi
          if [[ "${{ needs.hopecard-web.result }}" == "failure" ]]; then FAILED=true; fi
          if [ "$FAILED" = "true" ]; then echo "❌ Failed!"; exit 1; fi
          echo "✅ All passed!"
```

### sonar-project.properties (at repo root)

```properties
# Sources — all sub-project src directories
sonar.sources=BayaniHub-Web/src,DAMAYAN-Web/src,HopeCard-Web/src

# Tests
sonar.tests=BayaniHub-Web/tests,DAMAYAN-Web/tests,HopeCard-Web/tests

# Coverage — merge coverage from all sub-projects
sonar.javascript.lcov.reportPaths=BayaniHub-Web/coverage/lcov.info,DAMAYAN-Web/coverage/lcov.info,HopeCard-Web/coverage/lcov.info

# Exclusions
sonar.coverage.exclusions=**/tests/**,**/*.test.*,**/node_modules/**
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**
```

> `sonar.organization` and `sonar.projectKey` are omitted — they come from GitHub Secrets via CLI args.

---

## 5. Single-System Backend Repo

> Backend projects must use **NestJS (TypeScript-only)** with **Jest** for testing. JavaScript-only backend projects are not allowed.

**Example:** `ThriniThrive-Backend`, `BluesClues-Backend`, `APICenter`

### Folder Structure

```
Tribe-Backend/
├── .github/
│   └── workflows/
│       ├── master-pipeline.yml         ← orchestrator (Template B)
│       ├── backend-workflow.yml         ← reusable (COPY)
│       ├── backend-tests.yml            ← reusable (COPY)
│       ├── lint-check.yml               ← reusable (COPY)
│       ├── security-scan.yml            ← reusable (COPY)
│       ├── docker-build.yml             ← reusable (COPY)
│       ├── deploy-staging.yml           ← reusable (COPY)
│       └── production-gate.yml          ← reusable (COPY)
├── src/
│   ├── main.ts                          ← Nest bootstrap entry point
│   ├── app.module.ts                    ← Root module
│   └── ...
├── tests/
│   └── api.test.js
├── package.json
├── package-lock.json                    ← REQUIRED (npm ci needs this)
├── jest.config.js                       ← Jest config with coverage
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.js                     ← ESLint v9 flat config (no React plugins)
├── sonar-project.properties
└── Dockerfile                           ← for Docker build step (optional)
```

### Key Differences from Frontend

| Feature | Frontend (Next.js) | Backend (NestJS + TypeScript) |
|---|---|---|
| Orchestrator workflow | `front-end-workflow.yml` | `backend-workflow.yml` |
| Test runner | Vitest | Jest |
| Test config | `vitest.config.ts` | `jest.config.js` |
| Build output | `.next/` (via `next build`) | Docker image (via `docker-build.yml`) |
| Entry point | `app/page.jsx` (or `src/app/page.jsx`) | `src/main.ts` |
| ESLint plugins | `eslint-plugin-react`, `eslint-plugin-react-hooks` | None (Node.js globals only) |
| `app-type` in deploy | `web` | `api` |

### master-pipeline.yml (Template B — Backend)

```yaml
name: "Master Pipeline Orchestrator"

on:
  push:
    branches: [test, uat, prod]
  pull_request:
    branches: [test, uat, prod]

permissions:
  contents: read
  packages: write
  pull-requests: write

concurrency:
  group: pipeline-${{ github.ref }}
  cancel-in-progress: true

jobs:
  backend:
    name: "REPLACE_WITH_SYSTEM_NAME Pipeline"
    uses: ./.github/workflows/backend-workflow.yml
    with:
      system-dir: "."
      system-name: REPLACE_WITH_SYSTEM_NAME
      enable-docker-build: true
      docker-image-name: REPLACE_WITH_IMAGE_NAME
    secrets: inherit

  sonarcloud:
    name: "SonarCloud Analysis"
    needs: [backend]
    if: always() && needs.backend.result != 'cancelled'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/download-artifact@v4
        if: needs.backend.result == 'success'
        with:
          name: REPLACE_WITH_SYSTEM_NAME-coverage
          path: coverage
        continue-on-error: true
      - uses: SonarSource/sonarqube-scan-action@v6
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >
            -Dsonar.organization=${{ secrets.SONAR_ORGANIZATION }}
            -Dsonar.projectKey=${{ secrets.SONAR_PROJECT_KEY }}

  deploy-uat:
    name: "UAT — REPLACE_WITH_SYSTEM_NAME"
    needs: [backend]
    if: github.ref == 'refs/heads/uat' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: "."
      system-name: REPLACE_WITH_SYSTEM_NAME
      app-type: api
      artifact-name: REPLACE_WITH_SYSTEM_NAME-docker-image
      deploy-environment: uat
    secrets: inherit

  production-gate:
    name: "Production Gate"
    needs: [backend]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/production-gate.yml
    with:
      system-dir: "."
      app-type: api
    secrets: inherit

  deploy-prod:
    name: "Prod — REPLACE_WITH_SYSTEM_NAME"
    needs: [production-gate]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: "."
      system-name: REPLACE_WITH_SYSTEM_NAME
      app-type: api
      artifact-name: REPLACE_WITH_SYSTEM_NAME-docker-image
      deploy-environment: prod
    secrets: inherit

  pipeline-summary:
    name: "Pipeline Summary"
    needs: [backend]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Results
        run: |
          echo "REPLACE_WITH_SYSTEM_NAME: ${{ needs.backend.result }}"
          if [[ "${{ needs.backend.result }}" == "failure" ]]; then exit 1; fi
```

### package.json (Backend)

```json
{
  "name": "your-backend-name",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "node dist/main",
    "start:dev": "nest start --watch",
    "test": "jest",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "lint": "eslint ."
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.7.0",
    "supertest": "^6.3.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "eslint": "^9.0.0",
    "@eslint/js": "^9.0.0",
    "globals": "^15.0.0"
  }
}
```

### jest.config.js

```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageReporters: ['text', 'json', 'json-summary', 'lcov'],
  coverageDirectory: 'coverage',
  testMatch: ['**/tests/**/*.test.{js,ts}'],
};
```

### eslint.config.js (Backend — no React)

```javascript
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2021 },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
];
```

### Dockerfile (optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Setup Commands

```bash
npm install
npm test          # verify jest passes
npm run test:cov  # verify coverage works
npm run lint      # verify eslint passes
```

---

## 6. Single-System Mobile Repo

> Mobile projects use **React Native** with **Jest** for testing. They follow the same branching strategy but use `mobile-workflow.yml` and can optionally build an Android APK.

**Example:** `GCkaSoho-Mobile`, `ServEase-Mobile`, `CapusOne-Mobile`

### Folder Structure

```
Tribe-Mobile/
├── .github/
│   └── workflows/
│       ├── master-pipeline.yml         ← orchestrator (Template C)
│       ├── mobile-workflow.yml          ← reusable (COPY)
│       ├── mobile-tests.yml             ← reusable (COPY)
│       ├── lint-check.yml               ← reusable (COPY)
│       ├── security-scan.yml            ← reusable (COPY)
│       ├── deploy-staging.yml           ← reusable (COPY)
│       └── production-gate.yml          ← reusable (COPY)
├── src/
│   └── App.jsx
├── tests/
│   └── App.test.js
├── android/                             ← React Native android directory
│   ├── gradlew
│   └── app/
├── ios/                                 ← React Native iOS directory
├── package.json
├── package-lock.json                    ← REQUIRED
├── jest.config.js
├── eslint.config.js
├── sonar-project.properties
└── index.js                             ← React Native entry point
```

### Key Differences from Frontend

| Feature | Frontend (Next.js) | Mobile (React Native) |
|---|---|---|
| Orchestrator workflow | `front-end-workflow.yml` | `mobile-workflow.yml` |
| Test runner | Vitest | Jest |
| Test config | `vitest.config.ts` | `jest.config.js` (with `react-native` preset) |
| Build output | `.next/` (Next.js) | APK (Gradle) |
| Entry point | `app/page.jsx` | `index.js` |
| `app-type` in deploy | `web` | `mobile` |
| Extra dirs | — | `android/`, `ios/` |

### master-pipeline.yml (Template C — Mobile)

```yaml
name: "Master Pipeline Orchestrator"

on:
  push:
    branches: [test, uat, prod]
  pull_request:
    branches: [test, uat, prod]

permissions:
  contents: read
  packages: write
  pull-requests: write

concurrency:
  group: pipeline-${{ github.ref }}
  cancel-in-progress: true

jobs:
  mobile:
    name: "REPLACE_WITH_SYSTEM_NAME Pipeline"
    uses: ./.github/workflows/mobile-workflow.yml
    with:
      system-dir: "."
      system-name: REPLACE_WITH_SYSTEM_NAME
      build-android: true
      build-variant: assembleRelease
    secrets: inherit

  sonarcloud:
    name: "SonarCloud Analysis"
    needs: [mobile]
    if: always() && needs.mobile.result != 'cancelled'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/download-artifact@v4
        if: needs.mobile.result == 'success'
        with:
          name: REPLACE_WITH_SYSTEM_NAME-coverage
          path: coverage
        continue-on-error: true
      - uses: SonarSource/sonarqube-scan-action@v6
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >
            -Dsonar.organization=${{ secrets.SONAR_ORGANIZATION }}
            -Dsonar.projectKey=${{ secrets.SONAR_PROJECT_KEY }}

  deploy-uat:
    name: "UAT — REPLACE_WITH_SYSTEM_NAME"
    needs: [mobile]
    if: github.ref == 'refs/heads/uat' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: "."
      system-name: REPLACE_WITH_SYSTEM_NAME
      app-type: mobile
      artifact-name: REPLACE_WITH_SYSTEM_NAME-android-apk
      deploy-environment: uat
    secrets: inherit

  production-gate:
    name: "Production Gate"
    needs: [mobile]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/production-gate.yml
    with:
      system-dir: "."
      app-type: mobile
    secrets: inherit

  deploy-prod:
    name: "Prod — REPLACE_WITH_SYSTEM_NAME"
    needs: [production-gate]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: "."
      system-name: REPLACE_WITH_SYSTEM_NAME
      app-type: mobile
      artifact-name: REPLACE_WITH_SYSTEM_NAME-android-apk
      deploy-environment: prod
    secrets: inherit

  pipeline-summary:
    name: "Pipeline Summary"
    needs: [mobile]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Results
        run: |
          echo "REPLACE_WITH_SYSTEM_NAME: ${{ needs.mobile.result }}"
          if [[ "${{ needs.mobile.result }}" == "failure" ]]; then exit 1; fi
```

### package.json (Mobile)

```json
{
  "name": "your-mobile-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "react-native start",
    "test": "jest --coverage --verbose --ci --forceExit",
    "lint": "eslint .",
    "android": "react-native run-android",
    "ios": "react-native run-ios"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.74.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "@testing-library/react-native": "^12.0.0",
    "react-test-renderer": "^18.2.0",
    "eslint": "^9.0.0",
    "@eslint/js": "^9.0.0",
    "globals": "^15.0.0",
    "eslint-plugin-react": "^7.37.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-native": "^4.1.0"
  }
}
```

### jest.config.js (Mobile)

```javascript
module.exports = {
  preset: 'react-native',
  collectCoverage: true,
  coverageReporters: ['text', 'json', 'json-summary', 'lcov'],
  coverageDirectory: 'coverage',
  testMatch: ['**/tests/**/*.test.{js,jsx,ts,tsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)',
  ],
};
```

### eslint.config.js (Mobile — React + Node globals)

```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/', 'coverage/', 'node_modules/', 'android/', 'ios/'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2021, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'warn',
      'no-unused-vars': 'warn',
      'no-console': 'warn',
    },
  },
  {
    files: ['tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
];
```

### Setup Commands

```bash
npm install
npm test          # verify jest passes
npm run lint      # verify eslint passes
```

---

## 7. Required Files per System

Each frontend system (whether at root or in a subdirectory) needs these files:

### 5a. package.json

Must have these **scripts** and **devDependencies** at minimum:

```json
{
  "name": "your-system-name",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "npm run test -- --coverage",
    "lint": "eslint ."
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "@vitest/coverage-v8": "^4.0.18",
    "jsdom": "^28.1.0",
    "vite": "^4.3.9",
    "vitest": "^4.0.18",
    "eslint": "^9.0.0",
    "@eslint/js": "^9.0.0",
    "globals": "^15.0.0",
    "eslint-plugin-react": "^7.37.0",
    "eslint-plugin-react-hooks": "^5.0.0"
  }
}
```

**Linter Setup:**
- Install all linter dependencies:
  ```bash
  npm install --save-dev eslint@^9.0.0 @eslint/js@^9.0.0 globals@^15.0.0 eslint-plugin-react@^7.37.0 eslint-plugin-react-hooks@^5.0.0
  ```
- Add `eslint.config.js` (see below) to the system root.
- Add a `lint` script to `package.json`:
  ```json
  "lint": "eslint ."
  ```

**Why each dependency matters:**

| Dependency               | Required By                    |
|--------------------------|--------------------------------|
| `vitest`                 | `frontend-tests.yml` → runs `npx vitest run --coverage` |
| `@vitest/coverage-v8`   | `frontend-tests.yml` → coverage report generation        |
| `jsdom`                  | `vitest.config.ts` → `environment: 'jsdom'`             |
| `eslint`                 | `lint-check.yml` → runs `npx eslint . --max-warnings=0` |
| `vite`                   | `front-end-workflow.yml` → build step runs `npm run build` |

### 5b. package-lock.json (CRITICAL)

The pipeline uses `npm ci` (not `npm install`). This requires `package-lock.json`.

```bash
# Generate it by running:
npm install
```

> **`npm ci`** does a clean install from the lockfile — it's faster, deterministic, and what CI should always use. Without `package-lock.json`, `npm ci` will fail immediately.

### 5c. vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'lcov', 'html'],
    },
  },
});
```

**Why these reporters:**
- `text` — console output
- `json-summary` — parsed by `frontend-tests.yml` to check coverage threshold
- `lcov` — consumed by SonarCloud for code coverage analysis
- `json` + `html` — optional, for detailed reports

### 5d. eslint.config.js (ESLint v9 flat config)

```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',  // Not needed with React 18+
      'react/prop-types': 'warn',
      'no-unused-vars': 'warn',
      'no-console': 'warn',
    },
  },

  {
    files: ['tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.vitest,
      },
    },
  },
];
```

**Run the linter:**
```bash
npm run lint
```

### 5e. Next.js app entry (App Router)

```jsx
// app/page.jsx
export default function Page() {
  return <main>Hello Next.js</main>;
}
```

### 5f. src/main.jsx (minimal)

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 5g. src/App.jsx (minimal)

```jsx
function App() {
  return <div>Hello World</div>;
}

export default App;
```

### 5h. tests/ui.test.js (starter test)

```javascript
import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });
});
```

---

## 8. Workflow Files to Copy

Copy **all** these reusable workflow files into `.github/workflows/` of every new repo:

| File                      | Purpose                                    |
|---------------------------|--------------------------------------------|
| `front-end-workflow.yml`  | Frontend orchestrator (tests→lint→security→build) |
| `frontend-tests.yml`     | Vitest unit tests + coverage               |
| `lint-check.yml`         | ESLint + Prettier checks                   |
| `security-scan.yml`      | npm audit + license check                  |
| `deploy-staging.yml`     | Deploy to staging environment              |
| `production-gate.yml`    | Manual production approval gate            |
| `governance-check.yml`   | Coverage threshold governance              |

> **Note:** SonarCloud runs **inline in master-pipeline.yml** (not as a separate reusable workflow). This avoids CE task collisions in monorepos and keeps the scan architecture simpler.

Then create your own `master-pipeline.yml` based on the templates in sections 3, 4, 5, or 6 above.

For **backend** repos, also copy: `backend-workflow.yml`, `backend-tests.yml`, `docker-build.yml`
For **mobile** repos, also copy: `mobile-workflow.yml`, `mobile-tests.yml`

---

## 9. Quick Checklist

### Which Template to Use

| Repo Type | Template | Orchestrator Workflow | Test Runner |
|---|---|---|---|
| Single-system frontend (Next.js) | **Section 3 (Template A)** | `front-end-workflow.yml` | Vitest |
| Multi-system frontend monorepo | **Section 4 (Template D)** | `front-end-workflow.yml` | Vitest |
| Single-system backend (NestJS + TypeScript) | **Section 5 (Template B)** | `backend-workflow.yml` | Jest |
| Single-system mobile (React Native) | **Section 6 (Template C)** | `mobile-workflow.yml` | Jest |

### Per Repository

- [ ] Copy all reusable workflow files to `.github/workflows/`
- [ ] Create `master-pipeline.yml` using the correct template (see table above)
- [ ] Add GitHub secrets: `SONAR_TOKEN`, `SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION`
- [ ] Create SonarCloud project (sonarcloud.io) and note the project key
- [ ] Create `sonar-project.properties` (at root for monorepo, listing all sub-project paths)
- [ ] Create branches: `test`, `uat`, `prod`
- [ ] Set up GitHub Environments: `uat` and `production` (with required reviewers)

### Per Frontend System (Next.js)

- [ ] `package.json` with scripts: `dev`, `build`, `test`, `lint`
- [ ] `package-lock.json` exists (run `npm install` to generate)
- [ ] `next.config.js` exists
- [ ] `app/page.jsx` exists (or `src/app/page.jsx`)
- [ ] `vitest.config.ts` or `jest.config.js` exists with coverage enabled
- [ ] `eslint.config.js` (ESLint v9 flat config with React plugins)
- [ ] `tests/` directory with at least one `.test.js` file
- [ ] Verify: `npm test`, `npm run lint`, `npm run build`

### Per Backend System (NestJS + TypeScript)

- [ ] `package.json` with scripts: `start`, `start:dev`, `build`, `test`, `test:cov`, `test:e2e`, `lint`
- [ ] `package-lock.json` exists
- [ ] `src/main.ts` and `src/app.module.ts` exist (NestJS entry/module)
- [ ] `jest.config.js` with `node` environment and coverage reporters
- [ ] `tsconfig.json` and `tsconfig.build.json` exist
- [ ] `eslint.config.js` (ESLint v9 flat config for TypeScript + Node)
- [ ] `tests/` directory with at least one `.test.js` file
- [ ] `Dockerfile` (optional, for Docker build)
- [ ] Verify: `npm test`, `npm run lint`

### Per Mobile System (React Native)

- [ ] `package.json` with scripts: `start`, `test`, `lint`
- [ ] `package-lock.json` exists
- [ ] `index.js` (React Native entry point)
- [ ] `jest.config.js` with `react-native` preset and coverage reporters
- [ ] `eslint.config.js` (ESLint v9 flat config with React + Node globals)
- [ ] `android/` directory with `gradlew` (for APK builds)
- [ ] `tests/` directory with at least one `.test.js` file
- [ ] Verify: `npm test`, `npm run lint`

### Pipeline Flow (all repo types)

```
master-pipeline.yml
  │
  ├─ [monorepo only] detect-changes       → skip unchanged sub-projects
  │
  ├─ FRONTEND: front-end-workflow.yml      (Next.js)
  │    ├─ frontend-tests.yml               → npm ci → vitest run --coverage
  │    ├─ lint-check.yml                   → npm ci → eslint . --max-warnings=0
  │    ├─ security-scan.yml                → npm audit + license check
  │    └─ Build                            → npm ci → next build → .next/
  │
  ├─ BACKEND: backend-workflow.yml         (NestJS + TypeScript)
  │    ├─ backend-tests.yml                → npm ci → npm run test:cov
  │    ├─ lint-check.yml                   → npm ci → eslint . --max-warnings=0
  │    ├─ security-scan.yml                → npm audit + license check
  │    └─ docker-build.yml                 → Docker build → GHCR push
  │
  ├─ MOBILE: mobile-workflow.yml           (React Native)
  │    ├─ mobile-tests.yml                 → npm ci → jest --coverage
  │    ├─ lint-check.yml                   → npm ci → eslint . --max-warnings=0
  │    ├─ security-scan.yml                → npm audit + license check
  │    └─ Android APK (optional)           → gradlew assembleRelease
  │
  ├─ SonarCloud                            → single scan, coverage from all sub-projects
  │
  ├─ [uat branch] Deploy to UAT
  │
  ├─ [prod branch] Production Gate         → manual approval (BEFORE deploy)
  └─ [prod branch] Deploy to Prod          → (AFTER gate approval)
```

### Common Failures & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `npm ci` fails with "no package-lock.json" | Missing lockfile | Run `npm install` locally, commit `package-lock.json` |
| `vitest: command not found` | Missing devDependency | Add `vitest` and `@vitest/coverage-v8` to `devDependencies` |
| `jest: command not found` | Missing devDependency | Add `jest` to `devDependencies` |
| `Cannot find module 'jsdom'` | Missing devDependency | Add `jsdom` to `devDependencies` (frontend only) |
| Build fails "Cannot find module 'next'" | Next.js not installed | Add `next` dependency and run `npm install` |
| SonarCloud "CE Task failed" | Multiple parallel scans on same key | Use single monorepo scan, not per-sub-project |
| SonarCloud "indexed twice" | `sonar.sources` and `sonar.tests` overlap | Sources = `src`, Tests = `tests` (separate dirs) |
| SonarCloud "Project not found" | Wrong key or org | Verify `SONAR_PROJECT_KEY` and `SONAR_ORGANIZATION` secrets |
| SonarCloud job skipped | `if` condition too strict | Use `!= 'cancelled'` instead of `== 'success'` |
| ESLint "config not found" | No ESLint config | Create `eslint.config.js` (flat config for ESLint v9) |
| Docker build fails | Missing `Dockerfile` | Create Dockerfile in repo root (backend only) |
| Android build fails | Missing `android/gradlew` | Ensure React Native android dir exists (mobile only) |
| Coverage below threshold | Insufficient tests | Add more tests or lower `coverage-threshold` input |
| Production deploys without approval | Gate runs after deploy | Gate must `needs: [CI]`, deploy must `needs: [production-gate]` |
