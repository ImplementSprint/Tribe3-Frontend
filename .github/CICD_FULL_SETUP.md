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
├── ThriniThrive          3 frontend repos + 1 backend repo      = 4 repos
├── GCkaSoho              2 frontend repos + 1 mobile + 1 backend = 4 repos
├── Crystal Gems          2 frontend repos + 1 backend repo      = 3 repos
├── Blues Clues            1 frontend repo  + 1 backend repo      = 2 repos
├── ServEase              1 mobile repo    + 1 backend repo       = 2 repos
├── CapusOne              1 frontend repo  + 1 mobile + 1 backend = 3 repos
└── APICenter             1 integration/backend repo              = 1 repo
                                                          TOTAL = 19 repos
```

### Pipeline Architecture

```
master-pipeline.yml  (per repo — triggers everything)
  │
  ├─ front-end-workflow.yml   OR   backend-workflow.yml   OR   mobile-workflow.yml
  │    │                             │                           │
  │    ├─ frontend-tests.yml         ├─ backend-tests.yml        ├─ mobile-tests.yml
  │    ├─ lint-check.yml             ├─ lint-check.yml           ├─ lint-check.yml
  │    ├─ security-scan.yml          ├─ security-scan.yml        ├─ security-scan.yml
  │    ├─ sonarcloud-scan.yml        ├─ sonarcloud-scan.yml      ├─ sonarcloud-scan.yml
  │    └─ Build (vite build)         ├─ docker-build.yml         └─ Android APK (optional)
  │                                  └─ Deploy                 
  │
  ├─ deploy-staging.yml      (uat → deploy to UAT | prod → deploy to Prod)
  └─ production-gate.yml     (prod only, manual approval)
```

### Branching Strategy

```
  test branch        uat branch          prod branch
  ─────────────      ──────────────      ──────────────
  CI only            CI + Deploy UAT     CI + Deploy Prod
  (tests, lint,      (same as test,      (same as uat,
   security,          PLUS deploy to      PLUS production
   sonar, build)      UAT environment)    gate approval)

  Push flow:   test ──merge──▶ uat ──merge──▶ prod
```

| Branch | What Runs | Deploy? | Approval? |
|--------|-----------|---------|----------|
| `test` | Tests + Lint + Security + SonarCloud + Build | No | No |
| `uat`  | All CI + Deploy to UAT environment | Yes (UAT) | No |
| `prod` | All CI + Deploy to Prod + Production Gate | Yes (Prod) | Yes |

---

## 2. Repository Inventory

### ThriniThrive (4 repos)

| Repository | Type | Systems | system-dir | system-name |
|---|---|---|---|---|
| `ThriniThrive-Frontend-1` | Frontend | Single | `"."` | *(project name)* |
| `ThriniThrive-Frontend-2` | Frontend | Single | `"."` | *(project name)* |
| `ThriniThrive-Frontend-3` | Frontend | Single | `"."` | *(project name)* |
| `ThriniThrive-Backend` | Backend | Single | `"."` | *(project name)* |

> **Note:** If all 3 frontends are in one repo (like Tribe3), use subdirectories with `system-dir: SubdirName`. If they are separate repos, each uses `system-dir: "."`.

### GCkaSoho (4 repos)

| Repository | Type | Systems | system-dir | system-name |
|---|---|---|---|---|
| `GCkaSoho-Frontend-1` | Frontend | Single | `"."` | *(project name)* |
| `GCkaSoho-Frontend-2` | Frontend | Single | `"."` | *(project name)* |
| `GCkaSoho-Mobile` | Mobile | Single | `"."` | *(project name)* |
| `GCkaSoho-Backend` | Backend | Single | `"."` | *(project name)* |

### Crystal Gems (3 repos)

| Repository | Type | Systems | system-dir | system-name |
|---|---|---|---|---|
| `CrystalGems-Frontend-1` | Frontend | Single | `"."` | *(project name)* |
| `CrystalGems-Frontend-2` | Frontend | Single | `"."` | *(project name)* |
| `CrystalGems-Backend` | Backend | Single | `"."` | *(project name)* |

### Blues Clues (2 repos)

| Repository | Type | Systems | system-dir | system-name |
|---|---|---|---|---|
| `BluesClues-Frontend` | Frontend | Single | `"."` | *(project name)* |
| `BluesClues-Backend` | Backend | Single | `"."` | *(project name)* |

### ServEase (2 repos)

| Repository | Type | Systems | system-dir | system-name |
|---|---|---|---|---|
| `ServEase-Mobile` | Mobile | Single | `"."` | *(project name)* |
| `ServEase-Backend` | Backend | Single | `"."` | *(project name)* |

### CapusOne (3 repos)

| Repository | Type | Systems | system-dir | system-name |
|---|---|---|---|---|
| `CapusOne-Frontend` | Frontend | Single | `"."` | *(project name)* |
| `CapusOne-Mobile` | Mobile | Single | `"."` | *(project name)* |
| `CapusOne-Backend` | Backend | Single | `"."` | *(project name)* |

### APICenter (1 repo)

| Repository | Type | Systems | system-dir | system-name |
|---|---|---|---|---|
| `APICenter` | Backend (Integration) | Single | `"."` | `APICenter` |

---

## 3. GitHub Organization Secrets

Set these **once** at the org level (**Settings → Secrets and variables → Actions**) so every repo inherits them:

| Secret | Value | Scope |
|---|---|---|
| `SONAR_TOKEN` | SonarCloud authentication token | All repos |
| `SONAR_ORGANIZATION` | `implementsprint` | All repos |

> These are the same across all tribes. Set them at the org level to avoid configuring them 19 times.

---

## 4. Per-Repo Secrets

Each repo needs **one** repo-level secret (since the project key is unique per repo):

| Secret | Where | Value |
|---|---|---|
| `SONAR_PROJECT_KEY` | **Per repository** → Settings → Secrets | Unique SonarCloud project key |

See [Section 11](#11-sonarcloud-project-keys) for the full list of project keys.

---

## 5. Workflow Files to Copy

### For Frontend Repos

Copy these files into `.github/workflows/`:

| File | Purpose |
|---|---|
| `front-end-workflow.yml` | Frontend orchestrator |
| `frontend-tests.yml` | Vitest unit tests + coverage |
| `lint-check.yml` | ESLint checks |
| `security-scan.yml` | npm audit + Gitleaks |
| `sonarcloud-scan.yml` | SonarCloud quality gate |
| `deploy-staging.yml` | Staging deployment |
| `production-gate.yml` | Production approval gate |
| `governance-check.yml` | Coverage governance |

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

Each frontend system (at root or subdirectory) needs these files:

### Required File Structure

```
your-frontend-repo/
├── .github/workflows/         ← all reusable workflow files + master-pipeline.yml
├── src/
│   ├── App.jsx
│   └── main.jsx
├── tests/
│   └── ui.test.js
├── package.json               ← correct scripts + devDependencies
├── package-lock.json          ← REQUIRED (run npm install to generate)
├── vitest.config.ts           ← jsdom + v8 coverage
├── eslint.config.js           ← ESLint v9 flat config
└── index.html                 ← Vite entry point
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
└── Dockerfile
```

---

## 10. All master-pipeline.yml Templates

### Template A: Single-System Frontend

**Used by:** ThriniThrive-Frontend-1, ThriniThrive-Frontend-2, ThriniThrive-Frontend-3, GCkaSoho-Frontend-1, GCkaSoho-Frontend-2, CrystalGems-Frontend-1, CrystalGems-Frontend-2, BluesClues-Frontend, CapusOne-Frontend

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

  # ── Stage 3: Deploy to Prod (prod branch only) ──
  deploy-prod:
    name: "Prod — REPLACE_WITH_SYSTEM_NAME"
    needs: [frontend]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: "."
      system-name: REPLACE_WITH_SYSTEM_NAME
      app-type: web
      artifact-name: REPLACE_WITH_SYSTEM_NAME-web-build
      deploy-environment: prod
    secrets: inherit

  # ── Stage 4: Production Gate (prod branch only) ──
  production-gate:
    name: "Production Gate"
    needs: [deploy-prod]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/production-gate.yml
    with:
      system-dir: "."
      app-type: web
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

  # ── Stage 3: Deploy to Prod (prod branch only) ──
  deploy-prod:
    name: "Prod — REPLACE_WITH_SYSTEM_NAME"
    needs: [backend]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: "."
      system-name: REPLACE_WITH_SYSTEM_NAME
      app-type: api
      artifact-name: REPLACE_WITH_SYSTEM_NAME-docker-image
      deploy-environment: prod
    secrets: inherit

  # ── Stage 4: Production Gate (prod branch only) ──
  production-gate:
    name: "Production Gate"
    needs: [deploy-prod]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/production-gate.yml
    with:
      system-dir: "."
      app-type: api
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

  # ── Stage 3: Deploy to Prod (prod branch only) ──
  deploy-prod:
    name: "Prod — REPLACE_WITH_SYSTEM_NAME"
    needs: [mobile]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: "."
      system-name: REPLACE_WITH_SYSTEM_NAME
      app-type: mobile
      artifact-name: REPLACE_WITH_SYSTEM_NAME-android-apk
      deploy-environment: prod
    secrets: inherit

  # ── Stage 4: Production Gate (prod branch only) ──
  production-gate:
    name: "Production Gate"
    needs: [deploy-prod]
    if: github.ref == 'refs/heads/prod' && github.event_name == 'push'
    uses: ./.github/workflows/production-gate.yml
    with:
      system-dir: "."
      app-type: mobile
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

## 11. SonarCloud Project Keys

Create each project in [sonarcloud.io](https://sonarcloud.io) under the `implementsprint` organization.

Set the `SONAR_PROJECT_KEY` repo secret to the corresponding value:

### ThriniThrive

| Repository | `SONAR_PROJECT_KEY` |
|---|---|
| ThriniThrive-Frontend-1 | `ImplementSprint_ThriniThrive-Frontend-1` |
| ThriniThrive-Frontend-2 | `ImplementSprint_ThriniThrive-Frontend-2` |
| ThriniThrive-Frontend-3 | `ImplementSprint_ThriniThrive-Frontend-3` |
| ThriniThrive-Backend | `ImplementSprint_ThriniThrive-Backend` |

### GCkaSoho

| Repository | `SONAR_PROJECT_KEY` |
|---|---|
| GCkaSoho-Frontend-1 | `ImplementSprint_GCkaSoho-Frontend-1` |
| GCkaSoho-Frontend-2 | `ImplementSprint_GCkaSoho-Frontend-2` |
| GCkaSoho-Mobile | `ImplementSprint_GCkaSoho-Mobile` |
| GCkaSoho-Backend | `ImplementSprint_GCkaSoho-Backend` |

### Crystal Gems

| Repository | `SONAR_PROJECT_KEY` |
|---|---|
| CrystalGems-Frontend-1 | `ImplementSprint_CrystalGems-Frontend-1` |
| CrystalGems-Frontend-2 | `ImplementSprint_CrystalGems-Frontend-2` |
| CrystalGems-Backend | `ImplementSprint_CrystalGems-Backend` |

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

> **SonarCloud project key format:** `OrgName_RepoName` — this is the default when you import a GitHub repo into SonarCloud.

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
- [ ] Create all 19 SonarCloud projects at sonarcloud.io

### Step 2: Per-Repo Setup (repeat 19 times)

For each repository:

- [ ] **1. Create the repo** on GitHub under `ImplementSprint`
- [ ] **2. Set `SONAR_PROJECT_KEY`** repo secret (see Section 11)
- [ ] **3. Copy workflow files** to `.github/workflows/` (see Section 5)
- [ ] **4. Create `master-pipeline.yml`** using the correct template (see Section 10):
  - Frontend → Template A
  - Backend → Template B
  - Mobile → Template C
- [ ] **5. Replace all `REPLACE_WITH_SYSTEM_NAME`** placeholders in master-pipeline.yml
- [ ] **6. Add source files** (`src/`, `tests/`, config files — see Sections 6/7/8)
- [ ] **7. Run `npm install`** to generate `package-lock.json`
- [ ] **8. Verify locally:**
  - `npm test` passes
  - `npm run lint` passes
  - `npm run build` works (frontend only)
- [ ] **9. Create branches** — `test`, `uat`, `prod` (see Step 0)
- [ ] **10. Push to `test` branch** — CI pipeline should trigger (tests + lint + sonar, no deploy)
- [ ] **11. Merge `test` → `uat`** — CI + UAT deployment should trigger
- [ ] **12. Merge `uat` → `prod`** — CI + Prod deployment + production gate should trigger

### Quick Reference: Which Template for Each Repo

| Repo | Template |
|---|---|
| ThriniThrive-Frontend-1 | A (Frontend) |
| ThriniThrive-Frontend-2 | A (Frontend) |
| ThriniThrive-Frontend-3 | A (Frontend) |
| ThriniThrive-Backend | B (Backend) |
| GCkaSoho-Frontend-1 | A (Frontend) |
| GCkaSoho-Frontend-2 | A (Frontend) |
| GCkaSoho-Mobile | C (Mobile) |
| GCkaSoho-Backend | B (Backend) |
| CrystalGems-Frontend-1 | A (Frontend) |
| CrystalGems-Frontend-2 | A (Frontend) |
| CrystalGems-Backend | B (Backend) |
| BluesClues-Frontend | A (Frontend) |
| BluesClues-Backend | B (Backend) |
| ServEase-Mobile | C (Mobile) |
| ServEase-Backend | B (Backend) |
| CapusOne-Frontend | A (Frontend) |
| CapusOne-Mobile | C (Mobile) |
| CapusOne-Backend | B (Backend) |
| APICenter | B (Backend) |

---

### Common Failures & Fixes

| Error | Cause | Fix |
|---|---|---|
| `npm ci` fails | Missing `package-lock.json` | Run `npm install` locally, commit the lockfile |
| `vitest: command not found` | Missing devDependency | Add `vitest` + `@vitest/coverage-v8` to devDependencies |
| `jest: command not found` | Missing devDependency | Add `jest` to devDependencies |
| `Cannot find module 'jsdom'` | Missing devDependency | Add `jsdom` to devDependencies (frontend only) |
| SonarCloud "indexed twice" | `sonar.sources` and `sonar.tests` overlap | Sources = `src`, Tests = `tests` (separate dirs) |
| ESLint "config not found" | No ESLint config | Create `eslint.config.js` |
| Build fails "no index.html" | Missing Vite entry | Add `index.html` at system root (frontend only) |
| Docker build fails | Missing `Dockerfile` | Create Dockerfile in repo root (backend only) |
| Android build fails | Missing `android/gradlew` | Ensure React Native android dir exists (mobile only) |
| Secret not found | Repo secret not set | Go to repo Settings → Secrets → add missing secret |
