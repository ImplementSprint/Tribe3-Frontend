# ImplementSprint — CI/CD Pipeline Setup (All Tribes)

> Complete setup guide for every repository across all 6 tribes + APICenter.
> Organization: **ImplementSprint** | Pipeline Version: February 2026

---

## Table of Contents

1. [Organization Overview](#1-organization-overview)
2. [Repository Inventory](#2-repository-inventory)
3. [GitHub Organization Secrets](#3-github-organization-secrets)
4. [Per-Repo Secrets](#4-per-repo-secrets)
5. [Workflow Files to Copy](#5-workflow-files-to-copy)
6. [Frontend Repo Setup](#6-frontend-repo-setup)
7. [Backend Repo Setup](#7-backend-repo-setup)
8. [Mobile Repo Setup](#8-mobile-repo-setup)
9. [APICenter (Integration) Repo Setup](#9-apicenter-integration-repo-setup)
10. [All master-pipeline.yml Templates](#10-all-master-pipelineyml-templates)
11. [SonarCloud Project Keys](#11-sonarcloud-project-keys)
12. [Rollout Checklist](#12-rollout-checklist)

---

## 1. Organization Overview

```
ImplementSprint (GitHub Org)
│
├── ThriniThrive          1 frontend monorepo (3 dirs) + 1 backend = 2 repos
├── GCkaSoho              1 frontend monorepo (2 dirs) + 1 mobile + 1 backend = 3 repos
├── Crystal Gems          1 frontend monorepo (2 dirs) + 1 backend = 2 repos
├── Blues Clues            1 frontend repo  + 1 backend repo      = 2 repos
├── ServEase              1 mobile repo    + 1 backend repo       = 2 repos
├── CapusOne              1 frontend repo  + 1 mobile + 1 backend = 3 repos
└── APICenter             1 integration/backend repo              = 1 repo
                                                          TOTAL = 15 repos
```

> **Monorepo pattern:** When a tribe has multiple frontends, they live as **subdirectories in one repo** (not separate repos). For example, `TriniThrive-Frontend` contains `BayaniHub-Web/`, `DAMAYAN-Web/`, and `HopeCard-Web/` — all in one repository.

### Pipeline Architecture

```
master-pipeline.yml  (per repo — triggers everything)
  │
  ├─ [Multi-system only] detect-changes  (dorny/paths-filter — skip unchanged dirs)
  │
  ├─ front-end-workflow.yml   OR   backend-workflow.yml   OR   mobile-workflow.yml
  │    │                             │                           │
  │    ├─ frontend-tests.yml         ├─ backend-tests.yml        ├─ mobile-tests.yml
  │    ├─ lint-check.yml             ├─ lint-check.yml           ├─ lint-check.yml
  │    ├─ security-scan.yml          ├─ security-scan.yml        ├─ security-scan.yml
  │    └─ Build (vite build)         ├─ docker-build.yml         └─ Android APK (optional)
  │                                  └─ Deploy
  │
  ├─ SonarCloud scan            (runs ONCE per repo — monorepo-level analysis)
  ├─ deploy-staging.yml         (uat → deploy to UAT | prod → deploy to Prod)
  └─ production-gate.yml        (prod only, manual approval BEFORE deploy)
```

> **SonarCloud:** Runs once at the **repo level** (not per sub-project) to avoid CE task collisions. Coverage artifacts from all sub-projects are downloaded and analyzed in one scan.

> **Production Gate:** Runs **before** deploying to prod (not after). Flow: CI → Gate → Deploy.

### Branching Strategy

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

> **Auto-Promotion:** After CI passes on `test`, the pipeline automatically merges into `uat`. After CI + UAT deploy passes on `uat`, it automatically merges into `main`. Only the production gate on `main` requires manual approval.

### Developer Workflow

1. Dev creates `feature/my-feature` from `test`
2. Dev pushes commits, opens PR → `test`
3. CI runs on the PR — reviewer sees green/red checks
4. Merge to `test` — CI runs, and if it passes, **auto-promotes to `uat`**
5. UAT pipeline runs (CI + deploy) — if it passes, **auto-promotes to `main`**
6. Main pipeline runs (CI) → **Production Gate (manual approval)** → deploys to production

---

## 2. Repository Inventory

### ThriniThrive (2 repos)

| Repository | Type | Structure | Sub-projects |
|---|---|---|---|
| `TriniThrive-Frontend` | Frontend | **Monorepo** (3 dirs) | `BayaniHub-Web/`, `DAMAYAN-Web/`, `HopeCard-Web/` |
| `ThriniThrive-Backend` | Backend | Single | — |

### GCkaSoho (3 repos)

| Repository | Type | Structure | Sub-projects |
|---|---|---|---|
| `GCkaSoho-Frontend` | Frontend | **Monorepo** (2 dirs) | *(2 system directories)* |
| `GCkaSoho-Mobile` | Mobile | Single | — |
| `GCkaSoho-Backend` | Backend | Single | — |

### Crystal Gems (2 repos)

| Repository | Type | Structure | Sub-projects |
|---|---|---|---|
| `CrystalGems-Frontend` | Frontend | **Monorepo** (2 dirs) | *(2 system directories)* |
| `CrystalGems-Backend` | Backend | Single | — |

### Blues Clues (2 repos)

| Repository | Type | Structure | Sub-projects |
|---|---|---|---|
| `BluesClues-Frontend` | Frontend | Single | — |
| `BluesClues-Backend` | Backend | Single | — |

### ServEase (2 repos)

| Repository | Type | Structure | Sub-projects |
|---|---|---|---|
| `ServEase-Mobile` | Mobile | Single | — |
| `ServEase-Backend` | Backend | Single | — |

### CapusOne (3 repos)

| Repository | Type | Structure | Sub-projects |
|---|---|---|---|
| `CapusOne-Frontend` | Frontend | Single | — |
| `CapusOne-Mobile` | Mobile | Single | — |
| `CapusOne-Backend` | Backend | Single | — |

### APICenter (1 repo)

| Repository | Type | Structure | Sub-projects |
|---|---|---|---|
| `APICenter` | Backend (Integration) | Single | — |

---

## 3. GitHub Organization Secrets

Set these **once** at the org level (**Settings → Secrets and variables → Actions**) so every repo inherits them:

| Secret | Value | Scope |
|---|---|---|
| `SONAR_TOKEN` | SonarCloud authentication token | All repos |
| `SONAR_ORGANIZATION` | `implementsprint` | All repos |

> These are the same across all tribes. Set them at the org level to avoid configuring them 15 times.

---

## 4. Per-Repo Secrets

Each repo needs **one** repo-level secret (since the project key is unique per repo):

| Secret | Where | Value |
|---|---|---|
| `SONAR_PROJECT_KEY` | **Per repository** → Settings → Secrets | Unique SonarCloud project key |

See [Section 11](#11-sonarcloud-project-keys) for the full list of project keys.

> **Important:** Monorepos with multiple frontends still use **one** SonarCloud project key per repo. The single scan covers all sub-project directories.

---

## 5. Workflow Files to Copy

### For Frontend Repos

Copy these files into `.github/workflows/`:

| File | Purpose |
|---|---|
| `front-end-workflow.yml` | Frontend orchestrator (tests→lint→security→build) |
| `frontend-tests.yml` | Vitest unit tests + coverage |
| `lint-check.yml` | ESLint checks |
| `security-scan.yml` | npm audit + Gitleaks |
| `deploy-staging.yml` | Staging deployment |
| `production-gate.yml` | Production approval gate |
| `governance-check.yml` | Coverage governance |

> **Note:** `sonarcloud-scan.yml` is optional. For monorepos, SonarCloud runs **inline in master-pipeline.yml** (not as a reusable workflow) to avoid parallel scan collisions. For single-system repos, you can use the reusable workflow or run it inline.

Then create your own `master-pipeline.yml` (see [Section 10](#10-all-master-pipelineyml-templates)).

### For Backend Repos

Copy everything above **plus**:

| File | Purpose |
|---|---|
| `backend-workflow.yml` | Backend orchestrator |
| `backend-tests.yml` | Jest unit + integration tests |
| `docker-build.yml` | Docker build → GHCR push |

Use `backend-workflow.yml` instead of `front-end-workflow.yml` in your `master-pipeline.yml`.

### For Mobile Repos

Copy the base files **plus**:

| File | Purpose |
|---|---|
| `mobile-workflow.yml` | Mobile orchestrator |
| `mobile-tests.yml` | Jest mobile tests + optional APK build |

Use `mobile-workflow.yml` in your `master-pipeline.yml`.

---

## 6. Frontend Repo Setup

> All frontend projects use **React + Vite**. Every React project **must** have an `index.html` at its root — this is the Vite entry point that loads `src/main.jsx`.

Each frontend system (at root or subdirectory) needs these files:

### Required File Structure

**Single-system repo (project at root):**

```
Tribe-Frontend/
├── .github/workflows/         ← all reusable workflow files + master-pipeline.yml
├── src/
│   ├── App.jsx
│   └── main.jsx
├── tests/
│   └── ui.test.js
├── package.json
├── package-lock.json          ← REQUIRED (run npm install to generate)
├── vitest.config.ts           ← jsdom + v8 coverage
├── eslint.config.js           ← ESLint v9 flat config
├── sonar-project.properties   ← SonarCloud config (sources, tests, exclusions)
└── index.html                 ← Vite entry point
```

**Multi-system monorepo (multiple frontends as subdirectories):**

```
Tribe-Frontend/
├── .github/workflows/
├── SystemA-Web/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   ├── package-lock.json
│   ├── vitest.config.ts
│   ├── eslint.config.js
│   └── index.html
├── SystemB-Web/
│   ├── ... (same structure)
├── SystemC-Web/
│   ├── ... (same structure)
└── sonar-project.properties   ← at REPO ROOT, covers ALL sub-projects
```

### package.json

```json
{
  "name": "your-system-name",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run --coverage",
    "lint": "eslint ."
  },
  "dependencies": {
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

### vitest.config.ts

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

### eslint.config.js

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
      globals: { ...globals.browser, ...globals.es2021 },
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
      globals: { ...globals.jest, ...globals.vitest },
    },
  },
];
```

### sonar-project.properties (single-system)

```properties
sonar.sources=src
sonar.tests=tests
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=**/tests/**,**/*.test.*,**/node_modules/**
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**
```

### sonar-project.properties (multi-system monorepo)

```properties
# Sources — comma-separated list of all sub-project src directories
sonar.sources=SystemA-Web/src,SystemB-Web/src,SystemC-Web/src

# Tests
sonar.tests=SystemA-Web/tests,SystemB-Web/tests,SystemC-Web/tests

# Coverage — merge coverage from all sub-projects
sonar.javascript.lcov.reportPaths=SystemA-Web/coverage/lcov.info,SystemB-Web/coverage/lcov.info,SystemC-Web/coverage/lcov.info

# Exclusions
sonar.coverage.exclusions=**/tests/**,**/*.test.*,**/node_modules/**
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**
```

> **Note:** `sonar.organization` and `sonar.projectKey` are NOT in the properties file — they come from GitHub Secrets and are passed via CLI args in the workflow.

### index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your App Name</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### tests/ui.test.js (starter)

```javascript
import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });
});
```

### Setup Commands

```bash
npm install
npm test          # verify vitest passes
npm run lint      # verify eslint passes
npm run build     # verify vite build works
```

---

## 7. Backend Repo Setup

### Required File Structure

```
your-backend-repo/
├── .github/workflows/         ← all reusable workflow files + master-pipeline.yml
├── src/
│   └── index.js               ← Express/Fastify entry point
├── tests/
│   └── api.test.js
├── package.json
├── package-lock.json          ← REQUIRED
├── jest.config.js             ← Jest config with coverage
├── eslint.config.js           ← ESLint v9 flat config
├── sonar-project.properties   ← SonarCloud config
└── Dockerfile                 ← (optional) for Docker build
```

### package.json

```json
{
  "name": "your-backend-name",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest --coverage --verbose --ci --forceExit",
    "lint": "eslint ."
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.0",
    "nodemon": "^3.1.0",
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

### eslint.config.js (backend — no React)

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

### tests/api.test.js (starter)

```javascript
describe('API', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });
});
```

### Dockerfile (optional — for Docker build step)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

### Setup Commands

```bash
npm install
npm test          # verify jest passes
npm run lint      # verify eslint passes
```

---

## 8. Mobile Repo Setup

### Required File Structure

```
your-mobile-repo/
├── .github/workflows/         ← all reusable workflow files + master-pipeline.yml
├── src/
│   └── App.jsx
├── tests/
│   └── App.test.js
├── android/                    ← React Native android directory
│   ├── gradlew
│   └── app/
├── ios/                        ← React Native ios directory
├── package.json
├── package-lock.json          ← REQUIRED
├── jest.config.js
├── eslint.config.js
├── sonar-project.properties
└── index.js                    ← React Native entry point
```

### package.json

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

### jest.config.js

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

### eslint.config.js (mobile)

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

### tests/App.test.js (starter)

```javascript
describe('App', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });
});
```

### Setup Commands

```bash
npm install
npm test          # verify jest passes
npm run lint      # verify eslint passes
```

---

## 9. APICenter (Integration) Repo Setup

APICenter is a backend/integration repo. Follow the **Backend Repo Setup** (Section 7).

Additional considerations for an integration repo:
- May run integration tests against other tribe APIs
- Set `integration-test-command` in the master-pipeline if needed
- May build a Docker image for deployment

```
APICenter/
├── .github/workflows/         ← backend workflow files + master-pipeline.yml
├── src/
├── tests/
├── package.json
├── package-lock.json
├── jest.config.js
├── eslint.config.js
├── sonar-project.properties
└── Dockerfile
```

---

## 10. All master-pipeline.yml Templates

### Template A: Single-System Frontend

**Used by:** BluesClues-Frontend, CapusOne-Frontend

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
    name: "REPLACE_WITH_SYSTEM_NAME Pipeline"
    uses: ./.github/workflows/front-end-workflow.yml
    with:
      system-dir: "."
      system-name: REPLACE_WITH_SYSTEM_NAME
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

  # ── Stage 2: Deploy to UAT (uat branch only) ──
  deploy-uat:
    name: "UAT — REPLACE_WITH_SYSTEM_NAME"
    needs: [frontend]
    if: github.ref == 'refs/heads/uat' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: "."
      system-name: REPLACE_WITH_SYSTEM_NAME
      app-type: web
      artifact-name: REPLACE_WITH_SYSTEM_NAME-web-build
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

  # ── Stage 3B: Deploy to Prod (after gate approval) ──
  deploy-prod:
    name: "Prod — REPLACE_WITH_SYSTEM_NAME"
    needs: [production-gate]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: "."
      system-name: REPLACE_WITH_SYSTEM_NAME
      app-type: web
      artifact-name: REPLACE_WITH_SYSTEM_NAME-web-build
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
          echo "REPLACE_WITH_SYSTEM_NAME: ${{ needs.frontend.result }}"
          if [[ "${{ needs.frontend.result }}" == "failure" ]]; then exit 1; fi
```

---

### Template B: Single-System Backend

**Used by:** ThriniThrive-Backend, GCkaSoho-Backend, CrystalGems-Backend, BluesClues-Backend, ServEase-Backend, CapusOne-Backend, APICenter

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
  backend:
    name: "REPLACE_WITH_SYSTEM_NAME Pipeline"
    uses: ./.github/workflows/backend-workflow.yml
    with:
      system-dir: "."
      system-name: REPLACE_WITH_SYSTEM_NAME
      enable-docker-build: true
      docker-image-name: REPLACE_WITH_IMAGE_NAME
    secrets: inherit

  # ── Stage 1.5: SonarCloud ──
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

  # ── Stage 2: Deploy to UAT (uat branch only) ──
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

  # ── Stage 3A: Production Gate (prod branch, BEFORE deploy) ──
  production-gate:
    name: "Production Gate"
    needs: [backend]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/production-gate.yml
    with:
      system-dir: "."
      app-type: api
    secrets: inherit

  # ── Stage 3B: Deploy to Prod (after gate approval) ──
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

---

### Template C: Single-System Mobile

**Used by:** GCkaSoho-Mobile, ServEase-Mobile, CapusOne-Mobile

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
  mobile:
    name: "REPLACE_WITH_SYSTEM_NAME Pipeline"
    uses: ./.github/workflows/mobile-workflow.yml
    with:
      system-dir: "."
      system-name: REPLACE_WITH_SYSTEM_NAME
      build-android: true
      build-variant: assembleRelease
    secrets: inherit

  # ── Stage 1.5: SonarCloud ──
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

  # ── Stage 2: Deploy to UAT (uat branch only) ──
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

  # ── Stage 3A: Production Gate (prod branch, BEFORE deploy) ──
  production-gate:
    name: "Production Gate"
    needs: [mobile]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/production-gate.yml
    with:
      system-dir: "."
      app-type: mobile
    secrets: inherit

  # ── Stage 3B: Deploy to Prod (after gate approval) ──
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

---

### Template D: Multi-System Frontend Monorepo

**Used by:** TriniThrive-Frontend, GCkaSoho-Frontend, CrystalGems-Frontend

> For tribes with **multiple frontends in one repo**. Each frontend lives in its own subdirectory.
> Uses `dorny/paths-filter` to skip unchanged sub-projects. SonarCloud runs once at the repo level.

Replace `SYSTEM_A`, `SYSTEM_B`, `SYSTEM_C` with your actual directory/system names (e.g., `BayaniHub-Web`, `DAMAYAN-Web`, `HopeCard-Web`).

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
      system-a: ${{ steps.filter.outputs.system-a }}
      system-b: ${{ steps.filter.outputs.system-b }}
      system-c: ${{ steps.filter.outputs.system-c }}
      shared: ${{ steps.filter.outputs.shared }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - id: filter
        uses: dorny/paths-filter@v3
        with:
          filters: |
            system-a:
              - 'SYSTEM_A/**'
            system-b:
              - 'SYSTEM_B/**'
            system-c:
              - 'SYSTEM_C/**'
            shared:
              - '.github/**'
              - 'package.json'
              - 'sonar-project.properties'

  # ── Stage 1: CI — each sub-project runs in parallel ──
  system-a:
    name: "SYSTEM_A Pipeline"
    needs: [detect-changes]
    if: needs.detect-changes.outputs.system-a == 'true' || needs.detect-changes.outputs.shared == 'true'
    uses: ./.github/workflows/front-end-workflow.yml
    with:
      system-dir: SYSTEM_A
      system-name: SYSTEM_A
    secrets: inherit

  system-b:
    name: "SYSTEM_B Pipeline"
    needs: [detect-changes]
    if: needs.detect-changes.outputs.system-b == 'true' || needs.detect-changes.outputs.shared == 'true'
    uses: ./.github/workflows/front-end-workflow.yml
    with:
      system-dir: SYSTEM_B
      system-name: SYSTEM_B
    secrets: inherit

  system-c:
    name: "SYSTEM_C Pipeline"
    needs: [detect-changes]
    if: needs.detect-changes.outputs.system-c == 'true' || needs.detect-changes.outputs.shared == 'true'
    uses: ./.github/workflows/front-end-workflow.yml
    with:
      system-dir: SYSTEM_C
      system-name: SYSTEM_C
    secrets: inherit

  # ── Stage 1.5: SonarCloud (single monorepo scan) ──
  sonarcloud:
    name: "SonarCloud — Monorepo Analysis"
    needs: [system-a, system-b, system-c]
    if: >-
      always() &&
      needs.system-a.result != 'cancelled' &&
      needs.system-b.result != 'cancelled' &&
      needs.system-c.result != 'cancelled'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/download-artifact@v4
        if: needs.system-a.result == 'success'
        with:
          name: SYSTEM_A-coverage
          path: SYSTEM_A/coverage
        continue-on-error: true
      - uses: actions/download-artifact@v4
        if: needs.system-b.result == 'success'
        with:
          name: SYSTEM_B-coverage
          path: SYSTEM_B/coverage
        continue-on-error: true
      - uses: actions/download-artifact@v4
        if: needs.system-c.result == 'success'
        with:
          name: SYSTEM_C-coverage
          path: SYSTEM_C/coverage
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
  deploy-uat-system-a:
    name: "UAT — SYSTEM_A"
    needs: [system-a]
    if: |
      always() &&
      github.ref == 'refs/heads/uat' && github.event_name == 'push' &&
      needs.system-a.result == 'success'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: SYSTEM_A
      system-name: SYSTEM_A
      app-type: web
      artifact-name: SYSTEM_A-web-build
      deploy-environment: uat
    secrets: inherit

  deploy-uat-system-b:
    name: "UAT — SYSTEM_B"
    needs: [system-b]
    if: |
      always() &&
      github.ref == 'refs/heads/uat' && github.event_name == 'push' &&
      needs.system-b.result == 'success'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: SYSTEM_B
      system-name: SYSTEM_B
      app-type: web
      artifact-name: SYSTEM_B-web-build
      deploy-environment: uat
    secrets: inherit

  deploy-uat-system-c:
    name: "UAT — SYSTEM_C"
    needs: [system-c]
    if: |
      always() &&
      github.ref == 'refs/heads/uat' && github.event_name == 'push' &&
      needs.system-c.result == 'success'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: SYSTEM_C
      system-name: SYSTEM_C
      app-type: web
      artifact-name: SYSTEM_C-web-build
      deploy-environment: uat
    secrets: inherit

  # ── Stage 3A: Production Gate (prod branch, BEFORE deploy) ──
  production-gate:
    name: "Production Readiness Gate"
    needs: [system-a, system-b, system-c]
    if: >-
      always() &&
      github.ref == 'refs/heads/prod' && github.event_name == 'push' &&
      needs.system-a.result != 'cancelled' &&
      needs.system-b.result != 'cancelled' &&
      needs.system-c.result != 'cancelled'
    uses: ./.github/workflows/production-gate.yml
    with:
      system-dir: Tribe-Frontend
      app-type: web
    secrets: inherit

  # ── Stage 3B: Deploy to Prod (after gate approval, parallel) ──
  deploy-prod-system-a:
    name: "Prod — SYSTEM_A"
    needs: [production-gate]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: SYSTEM_A
      system-name: SYSTEM_A
      app-type: web
      artifact-name: SYSTEM_A-web-build
      deploy-environment: prod
    secrets: inherit

  deploy-prod-system-b:
    name: "Prod — SYSTEM_B"
    needs: [production-gate]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: SYSTEM_B
      system-name: SYSTEM_B
      app-type: web
      artifact-name: SYSTEM_B-web-build
      deploy-environment: prod
    secrets: inherit

  deploy-prod-system-c:
    name: "Prod — SYSTEM_C"
    needs: [production-gate]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: SYSTEM_C
      system-name: SYSTEM_C
      app-type: web
      artifact-name: SYSTEM_C-web-build
      deploy-environment: prod
    secrets: inherit

  pipeline-summary:
    name: "Pipeline Summary"
    needs: [system-a, system-b, system-c]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Results
        run: |
          echo "SYSTEM_A: ${{ needs.system-a.result }}"
          echo "SYSTEM_B: ${{ needs.system-b.result }}"
          echo "SYSTEM_C: ${{ needs.system-c.result }}"
          FAILED=false
          if [[ "${{ needs.system-a.result }}" == "failure" ]]; then FAILED=true; fi
          if [[ "${{ needs.system-b.result }}" == "failure" ]]; then FAILED=true; fi
          if [[ "${{ needs.system-c.result }}" == "failure" ]]; then FAILED=true; fi
          if [ "$FAILED" = "true" ]; then echo "❌ Failed!"; exit 1; fi
          echo "✅ All passed!"
```

> **Adapting for 2 sub-projects:** Remove all `system-c` / `SYSTEM_C` references. The pattern is the same for any number of subdirectories.

---

## 11. SonarCloud Project Keys

Create each project in [sonarcloud.io](https://sonarcloud.io) under the `implementsprint` organization.

Set the `SONAR_PROJECT_KEY` repo secret to the corresponding value:

### ThriniThrive

| Repository | `SONAR_PROJECT_KEY` | Notes |
|---|---|---|
| TriniThrive-Frontend | `ImplementSprint_TriniThrive-Frontend` | Covers BayaniHub-Web + DAMAYAN-Web + HopeCard-Web |
| ThriniThrive-Backend | `ImplementSprint_ThriniThrive-Backend` | — |

### GCkaSoho

| Repository | `SONAR_PROJECT_KEY` | Notes |
|---|---|---|
| GCkaSoho-Frontend | `ImplementSprint_GCkaSoho-Frontend` | Covers both frontend systems |
| GCkaSoho-Mobile | `ImplementSprint_GCkaSoho-Mobile` | — |
| GCkaSoho-Backend | `ImplementSprint_GCkaSoho-Backend` | — |

### Crystal Gems

| Repository | `SONAR_PROJECT_KEY` | Notes |
|---|---|---|
| CrystalGems-Frontend | `ImplementSprint_CrystalGems-Frontend` | Covers both frontend systems |
| CrystalGems-Backend | `ImplementSprint_CrystalGems-Backend` | — |

### Blues Clues

| Repository | `SONAR_PROJECT_KEY` |
|---|---|
| BluesClues-Frontend | `ImplementSprint_BluesClues-Frontend` |
| BluesClues-Backend | `ImplementSprint_BluesClues-Backend` |

### ServEase

| Repository | `SONAR_PROJECT_KEY` |
|---|---|
| ServEase-Mobile | `ImplementSprint_ServEase-Mobile` |
| ServEase-Backend | `ImplementSprint_ServEase-Backend` |

### CapusOne

| Repository | `SONAR_PROJECT_KEY` |
|---|---|
| CapusOne-Frontend | `ImplementSprint_CapusOne-Frontend` |
| CapusOne-Mobile | `ImplementSprint_CapusOne-Mobile` |
| CapusOne-Backend | `ImplementSprint_CapusOne-Backend` |

### APICenter

| Repository | `SONAR_PROJECT_KEY` |
|---|---|
| APICenter | `ImplementSprint_APICenter` |

> **SonarCloud project key format:** `OrgName_RepoName` — this is the default when you import a GitHub repo into SonarCloud. Monorepos get **one** project key per repo (not per sub-project).

---

## 12. Rollout Checklist

### Step 0: Create Branch Strategy (do once per repo)

Each repo needs 3 long-lived branches:

```bash
git checkout -b test
git push -u origin test

git checkout -b uat
git push -u origin uat

git checkout -b prod
git push -u origin prod
```

In GitHub repo **Settings → Branches**, configure:
- [ ] Set default branch to `test` (or keep `main` for development, merge into `test` to trigger CI)
- [ ] Add branch protection rules for `uat` and `prod` (require PR, require status checks)
- [ ] Create GitHub Environments: `uat` and `production` (Settings → Environments)
- [ ] Add required reviewers on `production` environment for approval gate

### Step 1: Organization-Level Setup (do once)

- [ ] Set org secret `SONAR_TOKEN` at **ImplementSprint** → Settings → Secrets
- [ ] Set org secret `SONAR_ORGANIZATION` = `implementsprint` at org level
- [ ] Create all 15 SonarCloud projects at sonarcloud.io

### Step 2: Per-Repo Setup (repeat 15 times)

For each repository:

- [ ] **1. Create the repo** on GitHub under `ImplementSprint`
- [ ] **2. Set `SONAR_PROJECT_KEY`** repo secret (see Section 11)
- [ ] **3. Copy workflow files** to `.github/workflows/` (see Section 5)
- [ ] **4. Create `master-pipeline.yml`** using the correct template (see Section 10):
  - Single frontend → Template A
  - Single backend → Template B
  - Single mobile → Template C
  - **Multi-frontend monorepo → Template D**
- [ ] **5. Replace all placeholders** (`REPLACE_WITH_SYSTEM_NAME`, `SYSTEM_A`, `SYSTEM_B`, `SYSTEM_C`)
- [ ] **6. Add source files** (`src/`, `tests/`, config files — see Sections 6/7/8)
- [ ] **7. For monorepos:** create `sonar-project.properties` at repo root with all sub-project paths
- [ ] **8. Run `npm install`** in each system dir to generate `package-lock.json`
- [ ] **9. Verify locally:**
  - `npm test` passes
  - `npm run lint` passes
  - `npm run build` works (frontend only)
- [ ] **10. Create branches** — `test`, `uat`, `prod` (see Step 0)
- [ ] **11. Push to `test` branch** — CI pipeline should trigger (tests + lint + sonar, no deploy)
- [ ] **12. Merge `test` → `uat`** — CI + UAT deployment should trigger
- [ ] **13. Merge `uat` → `prod`** — CI + Production gate + Prod deployment should trigger

### Quick Reference: Which Template for Each Repo

| Repo | Template | Sub-projects |
|---|---|---|
| TriniThrive-Frontend | **D (Multi-Frontend Monorepo)** | BayaniHub-Web, DAMAYAN-Web, HopeCard-Web |
| ThriniThrive-Backend | B (Backend) | — |
| GCkaSoho-Frontend | **D (Multi-Frontend Monorepo)** | *(2 systems)* |
| GCkaSoho-Mobile | C (Mobile) | — |
| GCkaSoho-Backend | B (Backend) | — |
| CrystalGems-Frontend | **D (Multi-Frontend Monorepo)** | *(2 systems)* |
| CrystalGems-Backend | B (Backend) | — |
| BluesClues-Frontend | A (Frontend) | — |
| BluesClues-Backend | B (Backend) | — |
| ServEase-Mobile | C (Mobile) | — |
| ServEase-Backend | B (Backend) | — |
| CapusOne-Frontend | A (Frontend) | — |
| CapusOne-Mobile | C (Mobile) | — |
| CapusOne-Backend | B (Backend) | — |
| APICenter | B (Backend) | — |

---

### Common Failures & Fixes

| Error | Cause | Fix |
|---|---|---|
| `npm ci` fails | Missing `package-lock.json` | Run `npm install` locally, commit the lockfile |
| `vitest: command not found` | Missing devDependency | Add `vitest` + `@vitest/coverage-v8` to devDependencies |
| `jest: command not found` | Missing devDependency | Add `jest` to devDependencies |
| `Cannot find module 'jsdom'` | Missing devDependency | Add `jsdom` to devDependencies (frontend only) |
| SonarCloud "CE Task failed" | Multiple parallel scans on same project key | Use single monorepo scan (Template D) instead of per-sub-project scans |
| SonarCloud "indexed twice" | `sonar.sources` and `sonar.tests` overlap | Sources = `src`, Tests = `tests` (separate dirs) |
| SonarCloud "Project not found" | Wrong project key or org | Verify `SONAR_PROJECT_KEY` and `SONAR_ORGANIZATION` secrets match sonarcloud.io |
| SonarCloud job skipped | `if` condition too strict or upstream cancelled | Use `!= 'cancelled'` instead of `== 'success'` in the condition |
| ESLint "config not found" | No ESLint config | Create `eslint.config.js` |
| Build fails "no index.html" | Missing Vite entry | Add `index.html` at system root (frontend only) |
| Docker build fails | Missing `Dockerfile` | Create Dockerfile in repo root (backend only) |
| Android build fails | Missing `android/gradlew` | Ensure React Native android dir exists (mobile only) |
| Secret not found | Repo secret not set | Go to repo Settings → Secrets → add missing secret |
| Production gate after deploy | Wrong `needs` order in template | Gate must `needs: [CI]`, deploy must `needs: [production-gate]` |
