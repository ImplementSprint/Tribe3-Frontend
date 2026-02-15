# Repository Setup Guide — CI/CD Pipeline

> **How to set up any new tribe repository so the CI/CD pipeline runs successfully.**

---

## Table of Contents

1. [GitHub Secrets (Required)](#1-github-secrets-required)
2. [Single-System Repo (root directory)](#2-single-system-repo-root-directory)
3. [Multi-System Repo (subdirectories)](#3-multi-system-repo-subdirectories)
4. [Required Files per System](#4-required-files-per-system)
5. [Workflow Files to Copy](#5-workflow-files-to-copy)
6. [Quick Checklist](#6-quick-checklist)

---

## 1. GitHub Secrets (Required)

Go to **Settings → Secrets and variables → Actions** in the GitHub repo and add:

| Secret               | Description                                  | Example                           |
|----------------------|----------------------------------------------|-----------------------------------|
| `SONAR_TOKEN`        | SonarCloud authentication token              | *(from sonarcloud.io)*            |
| `SONAR_PROJECT_KEY`  | SonarCloud project key                       | `Tribe5-Frontend_PadyakPH-Web`    |
| `SONAR_ORGANIZATION` | SonarCloud organization key                  | `implementsprint`                 |

> **Tip:** For org-wide secrets (`SONAR_ORGANIZATION`, `SONAR_TOKEN`), set them at the **GitHub Organization level** so all tribe repos inherit them automatically.

---

## 2. Single-System Repo (root directory)

**Example:** `Tribe5-Frontend` with one system called `PadyakPH-Web`

### Folder Structure

```
Tribe5-Frontend/
├── .github/
│   └── workflows/
│       ├── master-pipeline.yml        ← orchestrator (YOU CREATE THIS)
│       ├── front-end-workflow.yml      ← reusable (COPY FROM TEMPLATE)
│       ├── frontend-tests.yml          ← reusable (COPY)
│       ├── lint-check.yml              ← reusable (COPY)
│       ├── security-scan.yml           ← reusable (COPY)
│       ├── sonarcloud-scan.yml         ← reusable (COPY)
│       ├── deploy-staging.yml          ← reusable (COPY)
│       └── production-gate.yml         ← reusable (COPY)
├── src/
│   ├── App.jsx
│   └── main.jsx
├── tests/
│   └── ui.test.js
├── package.json                        ← with correct scripts + deps
├── package-lock.json                   ← REQUIRED (npm ci needs this)
├── vitest.config.ts
├── eslint.config.js                    ← ESLint flat config
├── .prettierrc                         ← (optional) Prettier config
└── index.html                          ← Vite entry point
```

### master-pipeline.yml (Single System)

```yaml
name: "Master Pipeline Orchestrator"

on:
  push:
    branches: ["**"]
  pull_request:
    branches: [main, develop]

permissions:
  contents: read
  packages: write
  pull-requests: write

concurrency:
  group: pipeline-${{ github.ref }}
  cancel-in-progress: true

jobs:
  frontend:
    name: "PadyakPH-Web Pipeline"
    uses: ./.github/workflows/front-end-workflow.yml
    with:
      system-dir: "."                    # <-- root = "."
      system-name: PadyakPH-Web          # <-- your project name
    secrets: inherit

  deploy-staging:
    name: "Staging — PadyakPH-Web"
    needs: [frontend]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    uses: ./.github/workflows/deploy-staging.yml
    with:
      system-dir: "."
      system-name: PadyakPH-Web
      app-type: web
      artifact-name: PadyakPH-Web-web-build
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

## 3. Multi-System Repo (subdirectories)

**Example:** `Tribe3-Frontend` with 3 systems

### Folder Structure

```
Tribe3-Frontend/
├── .github/
│   └── workflows/
│       ├── master-pipeline.yml        ← orchestrator
│       └── ... (all reusable workflow files)
├── BayaniHub-Web/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   ├── package-lock.json
│   ├── vitest.config.ts
│   ├── eslint.config.js
│   └── index.html
├── DAMAYAN-Web/
│   ├── ... (same structure)
└── HopeCard-Web/
    ├── ... (same structure)
```

### master-pipeline.yml (Multi System)

```yaml
name: "Master Pipeline Orchestrator"

on:
  push:
    branches: ["**"]
  pull_request:
    branches: [main, develop]

permissions:
  contents: read
  packages: write
  pull-requests: write

concurrency:
  group: master-pipeline-${{ github.ref }}
  cancel-in-progress: true

jobs:
  bayanihub-web:
    name: "BayaniHub-Web Pipeline"
    uses: ./.github/workflows/front-end-workflow.yml
    with:
      system-dir: BayaniHub-Web         # <-- subdirectory name
      system-name: BayaniHub-Web        # <-- same as dir for multi-system
    secrets: inherit

  damayan-web:
    name: "DAMAYAN-Web Pipeline"
    uses: ./.github/workflows/front-end-workflow.yml
    with:
      system-dir: DAMAYAN-Web
      system-name: DAMAYAN-Web
    secrets: inherit

  hopecard-web:
    name: "HopeCard-Web Pipeline"
    uses: ./.github/workflows/front-end-workflow.yml
    with:
      system-dir: HopeCard-Web
      system-name: HopeCard-Web
    secrets: inherit
```

---

## 4. Required Files per System

Each system (whether at root or in a subdirectory) needs these files:

### 4a. package.json

Must have these **scripts** and **devDependencies** at minimum:

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

### 4b. package-lock.json (CRITICAL)

The pipeline uses `npm ci` (not `npm install`). This requires `package-lock.json`.

```bash
# Generate it by running:
npm install
```

> **`npm ci`** does a clean install from the lockfile — it's faster, deterministic, and what CI should always use. Without `package-lock.json`, `npm ci` will fail immediately.

### 4c. vitest.config.ts

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
- `lcov` — consumed by `sonarcloud-scan.yml` for SonarCloud analysis
- `json` + `html` — optional, for detailed reports

### 4d. eslint.config.js (ESLint v9 flat config)

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

### 4e. index.html (Vite entry point)

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

### 4f. src/main.jsx (minimal)

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

### 4g. src/App.jsx (minimal)

```jsx
function App() {
  return <div>Hello World</div>;
}

export default App;
```

### 4h. tests/ui.test.js (starter test)

```javascript
import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });
});
```

---

## 5. Workflow Files to Copy

Copy **all** these reusable workflow files into `.github/workflows/` of every new repo:

| File                      | Purpose                                    |
|---------------------------|--------------------------------------------|
| `front-end-workflow.yml`  | Frontend orchestrator (tests→lint→sonar→build) |
| `frontend-tests.yml`     | Vitest unit tests + coverage               |
| `lint-check.yml`         | ESLint + Prettier checks                   |
| `security-scan.yml`      | npm audit + Gitleaks + license check       |
| `sonarcloud-scan.yml`    | SonarCloud quality gate                    |
| `deploy-staging.yml`     | Deploy to staging environment              |
| `production-gate.yml`    | Manual production approval gate            |
| `governance-check.yml`   | Coverage threshold governance              |

Then create your own `master-pipeline.yml` based on the templates in sections 2 or 3 above.

For **backend** repos, also copy: `backend-workflow.yml`, `backend-tests.yml`, `docker-build.yml`
For **mobile** repos, also copy: `mobile-workflow.yml`, `mobile-tests.yml`

---

## 6. Quick Checklist

### Per Repository

- [ ] Copy all reusable workflow files to `.github/workflows/`
- [ ] Create `master-pipeline.yml` (single or multi-system)
- [ ] Add GitHub secrets: `SONAR_TOKEN`, `SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION`
- [ ] Create SonarCloud project (sonarcloud.io) and note the project key

### Per System (root or subdirectory)

- [ ] `package.json` with correct `scripts` (`test`, `build`, `lint`) and `devDependencies`
- [ ] `package-lock.json` exists (run `npm install` once to generate)
- [ ] `vitest.config.ts` with `jsdom` environment and `v8` coverage with required reporters
- [ ] `eslint.config.js` (ESLint v9 flat config)
- [ ] `index.html` at system root (Vite entry point)
- [ ] `src/main.jsx` and `src/App.jsx` exist
- [ ] `tests/` directory with at least one `.test.js` file
- [ ] Run `npm test` locally to verify tests pass before pushing

### Pipeline What-Runs-What

```
master-pipeline.yml
  └─ front-end-workflow.yml          (orchestrator)
       ├─ frontend-tests.yml         → npm ci → vitest run --coverage
       ├─ lint-check.yml             → npm ci → eslint . --max-warnings=0
       ├─ security-scan.yml          → npm audit + gitleaks
       ├─ sonarcloud-scan.yml        → sonar scanner (uses coverage from tests)
       └─ Build step                 → npm ci → npm run build
```

### Common Failures & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `npm ci` fails with "no package-lock.json" | Missing lockfile | Run `npm install` locally, commit `package-lock.json` |
| `vitest: command not found` | Missing devDependency | Add `vitest` and `@vitest/coverage-v8` to `devDependencies` |
| `Cannot find module 'jsdom'` | Missing devDependency | Add `jsdom` to `devDependencies` |
| SonarCloud "indexed twice" error | `sonar.sources` and `sonar.tests` overlap | Sources = `src`, Tests = `tests` (they must be separate directories) |
| ESLint "config not found" | No ESLint config | Create `eslint.config.js` (flat config for ESLint v9) |
| Build fails "no index.html" | Missing Vite entry | Add `index.html` at system root |
| Coverage below threshold | Insufficient tests | Add more tests or lower `coverage-threshold` input |
