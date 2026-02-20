# TriniThrive-Frontend

Monorepo for the TriniThrive platform frontend applications — **BayaniHub**, **DAMAYAN**, and **HopeCard**.

| Project | Description | Theme |
|---------|-------------|-------|
| [BayaniHub-Web](./BayaniHub-Web) | Community engagement platform | Civic participation |
| [DAMAYAN-Web](./DAMAYAN-Web) | Mutual aid & disaster relief | Emergency coordination |
| [HopeCard-Web](./HopeCard-Web) | Digital assistance card system | Aid distribution |

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Repository Structure](#repository-structure)
- [Branch Strategy](#branch-strategy)
- [CI/CD Pipeline](#cicd-pipeline)
- [Vercel Deployment Setup](#vercel-deployment-setup)
- [GitHub Secrets Reference](#github-secrets-reference)
- [SonarCloud Setup](#sonarcloud-setup)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Install these before starting:

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | 18+ (LTS) | [nodejs.org](https://nodejs.org/) or `nvm install 18` |
| **npm** | 9+ | Comes with Node.js |
| **Git** | 2.30+ | [git-scm.com](https://git-scm.com/) |
| **VS Code** | Latest | [code.visualstudio.com](https://code.visualstudio.com/) (recommended) |

### Recommended VS Code Extensions

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- GitLens (`eamodio.gitlens`)
- Vitest (`vitest.explorer`)

### Verify Installation

```bash
node --version    # Should be v18+
npm --version     # Should be v9+
git --version     # Should be v2.30+
```

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/ImplementSprint/TriniThrive-Frontend.git
cd TriniThrive-Frontend

# 2. Switch to the test branch (base for all feature work)
git checkout test
git pull origin test

# 3. Install dependencies for each project
cd BayaniHub-Web && npm install && cd ..
cd DAMAYAN-Web && npm install && cd ..
cd HopeCard-Web && npm install && cd ..

# 4. Run a specific project
cd BayaniHub-Web
npm run dev      # Starts at http://localhost:5173
```

### Running All Projects Simultaneously

Each project runs on Vite's default port. To run multiple at once, use different ports:

```bash
# Terminal 1
cd BayaniHub-Web && npm run dev -- --port 5173

# Terminal 2
cd DAMAYAN-Web && npm run dev -- --port 5174

# Terminal 3
cd HopeCard-Web && npm run dev -- --port 5175
```

---

## Repository Structure

```
TriniThrive-Frontend/
├── .github/
│   └── workflows/
│       ├── master-pipeline.yml      # Orchestrates all CI/CD
│       ├── front-end-workflow.yml    # Reusable: lint + test + build
│       ├── vercel-deploy.yml         # Reusable: Vercel deployment
│       ├── production-gate.yml       # Pre-production checklist
│       └── deploy-staging.yml        # Legacy (unused)
├── BayaniHub-Web/                    # Community engagement app
│   ├── src/
│   ├── tests/
│   ├── package.json
│   ├── vite.config.js
│   └── vitest.config.ts
├── DAMAYAN-Web/                      # Disaster relief app
│   ├── src/
│   ├── tests/
│   ├── package.json
│   ├── vite.config.js
│   └── vitest.config.ts
├── HopeCard-Web/                     # Aid card system app
│   ├── src/
│   ├── tests/
│   ├── package.json
│   ├── vite.config.js
│   └── vitest.config.ts
├── BRANCHING_AND_MERGE_GUIDE.md      # Detailed branching guide
├── sonar-project.properties          # SonarCloud config
└── README.md                         # This file
```

Each sub-project is an independent React + Vite app with its own `package.json` and `node_modules`. There is no root-level `package.json` — install dependencies inside each project folder.

---

## Branch Strategy

```
feature/login ──┐
feature/signup ─┤
feature/dashboard ─┼──► test ──► uat ──► main
feature/profile ───┘
```

| Branch | Purpose | Deploys To | Merge Method |
|--------|---------|------------|--------------|
| `feature/*` | Individual feature work | Local only | PR → `test` |
| `test` | Integration testing + pre-UAT validation | Vercel Preview (TEST) | Auto-creates PR → `uat` |
| `uat` | User Acceptance Testing | Vercel Preview (UAT) | Auto-creates PR → `main` |
| `main` | Production | Vercel Production | Manual PR approval |

### Workflow

1. **Create** feature branch from `test`: `git checkout -b feature/my-feature test`
2. **Push** and create PR to `test`
3. **CI runs** — lint, test, build for changed projects only
4. **Merge to `test`** — pipeline creates a version tag (for example: `test-v2026.02.21.123-abc1234`)
5. **`test` deploys** — each project is deployed to TEST Vercel
6. **PR auto-created** — `test → uat` with TEST Vercel links for review
7. **Merge PR to `uat`** — pipeline deploys each project to UAT Vercel
8. **PR auto-created** — `uat → main` with UAT Vercel links for review
9. **Approve PR to `main`** — production gate runs, then deploys to Vercel production

> See [BRANCHING_AND_MERGE_GUIDE.md](./BRANCHING_AND_MERGE_GUIDE.md) for detailed branching and merge conflict instructions.

---

## CI/CD Pipeline

The pipeline is defined in `.github/workflows/master-pipeline.yml` and runs on every push/PR to `test`, `uat`, or `main`.

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────┐
│  Stage 0: Detect Changes (skip unchanged projects)              │
├─────────────────────────────────────────────────────────────────┤
│  Stage 1: CI Pipelines (PARALLEL per project)                   │
│    ├── BayaniHub-Web: lint → test → build                       │
│    ├── DAMAYAN-Web:   lint → test → build                       │
│    └── HopeCard-Web:  lint → test → build                       │
├─────────────────────────────────────────────────────────────────┤
│  Stage 1.5: SonarCloud Analysis (all coverage combined)         │
├─────────────────────────────────────────────────────────────────┤
│  Stage 2: TEST Deploy (test branch only, PARALLEL per project)  │
│    └── Vercel Preview deploys                                   │
├─────────────────────────────────────────────────────────────────┤
│  Stage 3: UAT Deploy (uat branch only, PARALLEL per project)    │
│    └── Vercel Preview deploys                                   │
├─────────────────────────────────────────────────────────────────┤
│  Stage 4: Production Deploy (main branch only)                  │
│    ├── Production Readiness Gate                                │
│    └── Vercel Production deploys (PARALLEL per project)         │
├─────────────────────────────────────────────────────────────────┤
│  Stage 5: Container Images (main branch only)                   │
│    └── Build & push 3 app images to GHCR                        │
├─────────────────────────────────────────────────────────────────┤
│  PR Promotion: test → uat (PR) | uat → main (PR)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Vercel Deployment Setup

Each sub-project is deployed as a **separate Vercel project**. You need **6 Vercel projects** total (3 UAT + 3 Production), or 3 projects using Vercel's preview/production environments.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel@latest
```

### Step 2: Create Vercel Projects

For each sub-project, create a Vercel project via the dashboard or CLI:

```bash
# Example: BayaniHub-Web UAT
cd BayaniHub-Web
vercel link
# Select or create a project (e.g. "bayanihub-web-uat")
# Framework Preset: Vite
# Root Directory: ./ (since you're already inside BayaniHub-Web)
# Build Command: npm run build (or leave default)
# Output Directory: dist
```

Repeat for each project × environment combination:

| Vercel Project Name (example) | Sub-project | Environment |
|-------------------------------|-------------|-------------|
| `bayanihub-web-uat` | BayaniHub-Web | UAT |
| `bayanihub-web-prod` | BayaniHub-Web | Production |
| `damayan-web-uat` | DAMAYAN-Web | UAT |
| `damayan-web-prod` | DAMAYAN-Web | Production |
| `hopecard-web-uat` | HopeCard-Web | UAT |
| `hopecard-web-prod` | HopeCard-Web | Production |

> **Tip:** You can also use a single Vercel project per sub-project and deploy to both preview and production environments. In that case you only need 3 Vercel projects.

### Step 3: Get Vercel Project IDs

After linking, find the project ID in the `.vercel/project.json` file:

```bash
cat .vercel/project.json
# Output: { "projectId": "prj_xxxxxxxxxxxx", "orgId": "team_xxxxxxxxxxxx" }
```

Or from the Vercel Dashboard: **Project → Settings → General → Project ID**

### Step 4: Get Vercel Token and Org ID

1. **Vercel Token**: Go to [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create Token
2. **Org ID**: Found in `.vercel/project.json` after linking, or in your team settings

### Step 5: Add GitHub Secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

Add all secrets listed in the [GitHub Secrets Reference](#github-secrets-reference) section below.

### Step 6: Disable Vercel's Auto-Deploy (Important!)

Since the CI/CD pipeline handles deployments, disable Vercel's built-in Git integration to avoid duplicate deploys:

1. Go to each Vercel project → **Settings → Git**
2. Under **Ignored Build Step**, set the command to: `exit 0`

This tells Vercel to skip automatic builds when it detects a push. The GitHub Actions pipeline will handle all deployments via the Vercel CLI.

---

## GitHub Secrets Reference

All secrets are configured in **GitHub → Repo Settings → Secrets and variables → Actions**.

### Vercel Deployment Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token (shared) | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel team/org ID (shared) | `.vercel/project.json` → `orgId` |
| `TEST_VERCEL_PROJECT_ID_BAYANIHUB_WEB` | BayaniHub-Web TEST project ID | Vercel Dashboard → Project → Settings → General |
| `TEST_VERCEL_PROJECT_ID_DAMAYAN_WEB` | DAMAYAN-Web TEST project ID | Same as above |
| `TEST_VERCEL_PROJECT_ID_HOPECARD_WEB` | HopeCard-Web TEST project ID | Same as above |
| `UAT_VERCEL_PROJECT_ID_BAYANIHUB_WEB` | BayaniHub-Web UAT project ID | Vercel Dashboard → Project → Settings → General |
| `UAT_VERCEL_PROJECT_ID_DAMAYAN_WEB` | DAMAYAN-Web UAT project ID | Same as above |
| `UAT_VERCEL_PROJECT_ID_HOPECARD_WEB` | HopeCard-Web UAT project ID | Same as above |
| `PROD_VERCEL_PROJECT_ID_BAYANIHUB_WEB` | BayaniHub-Web Production project ID | Same as above |
| `PROD_VERCEL_PROJECT_ID_DAMAYAN_WEB` | DAMAYAN-Web Production project ID | Same as above |
| `PROD_VERCEL_PROJECT_ID_HOPECARD_WEB` | HopeCard-Web Production project ID | Same as above |

### SonarCloud Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SONAR_TOKEN` | SonarCloud authentication token | [sonarcloud.io/account/security](https://sonarcloud.io/account/security) |
| `SONAR_ORGANIZATION` | SonarCloud organization key | SonarCloud → Organization → Settings |
| `SONAR_PROJECT_KEY` | SonarCloud project key | SonarCloud → Project → Information |

### Other Secrets

| Secret Name | Description | Status |
|-------------|-------------|--------|
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions | Built-in (no setup needed) |

---

## SonarCloud Setup

1. Go to [sonarcloud.io](https://sonarcloud.io) and sign in with GitHub
2. Import the `ImplementSprint/TriniThrive-Frontend` repository
3. Note the **organization key** and **project key**
4. Add `SONAR_TOKEN`, `SONAR_ORGANIZATION`, and `SONAR_PROJECT_KEY` as GitHub secrets
5. The pipeline automatically uploads coverage from all 3 sub-projects into one SonarCloud analysis

Configuration is in [sonar-project.properties](./sonar-project.properties).

---

## Troubleshooting

### Build fails with "Could not resolve entry module index.html"

Each sub-project needs a `vite.config.js` at its root:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

Make sure `index.html` exists at the sub-project root (not inside `src/`).

### Vercel shows a white/blank page

- **Check the branch being deployed.** If Vercel is building from `main` but your code is only on a feature branch, the build will produce an empty app.
- Verify `vite.config.js` exists in the sub-project
- Check the Vercel project **Root Directory** is set to the sub-project folder (e.g., `BayaniHub-Web`)

### Tests fail with "Cannot find module"

Run `npm install` inside the sub-project directory — each project has its own `node_modules`.

### ESLint errors in CI

ESLint 9 uses flat config format. The config is in `eslint.config.js` (not `.eslintrc`). Make sure you're using ESLint 9+.

### Pipeline skips a project

The pipeline uses `dorny/paths-filter` to detect changes. If you only modified files in `BayaniHub-Web/`, only that project's pipeline runs. Changes to `.github/` or root files trigger all projects.

### Duplicate Vercel deployments

Disable Vercel's auto-deploy: Go to each Vercel project → **Settings → Git → Ignored Build Step** → set to `exit 0`.

---

## Adding a New Sub-Project

To add a fourth project (e.g., `NewSystem-Web`):

1. **Create the project folder** with React + Vite:
   ```bash
   mkdir NewSystem-Web && cd NewSystem-Web
   npm create vite@latest . -- --template react
   npm install
   ```

2. **Add config files** — copy from an existing project:
   - `vite.config.js`
   - `vitest.config.ts`
   - `eslint.config.js`

3. **Update `master-pipeline.yml`**:
   - Add the project to `detect-changes` path filters
   - Add a CI job (copy an existing one, change the `system-dir`)
   - Add TEST, UAT, and Prod deploy jobs
   - Update `create-pr-to-uat` and `create-pr-to-main` dependencies to include the new deploy job

4. **Update `sonar-project.properties`**:
   ```properties
   sonar.sources=...,NewSystem-Web/src
   sonar.tests=...,NewSystem-Web/tests
   sonar.javascript.lcov.reportPaths=...,NewSystem-Web/coverage/lcov.info
   ```

5. **Create Vercel projects** and add secrets:
   - `TEST_VERCEL_PROJECT_ID_NEWSYSTEM_WEB`
   - `UAT_VERCEL_PROJECT_ID_NEWSYSTEM_WEB`
   - `PROD_VERCEL_PROJECT_ID_NEWSYSTEM_WEB`

6. **Update this README** with the new project info.

---

## License

Internal project — ImplementSprint © 2026
