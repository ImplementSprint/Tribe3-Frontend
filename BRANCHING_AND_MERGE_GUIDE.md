# Branching Strategy & Merge Conflict Guide

## Table of Contents

- [Branch Overview](#branch-overview)
- [Branch Flow](#branch-flow)
- [How to Work with Feature Branches](#how-to-work-with-feature-branches)
- [How to Fix Merge Conflicts](#how-to-fix-merge-conflicts)
- [How to Prevent Merge Conflicts](#how-to-prevent-merge-conflicts)
- [Common Scenarios & Solutions](#common-scenarios--solutions)
- [Platform Governance Rules](#platform-governance-rules)
- [API Naming Convention](#api-naming-convention)
- [API URL Path Convention](#api-url-path-convention)
- [CI/CD Test Case Rules](#cicd-test-case-rules)
- [SonarCloud Quality Gate Rules](#sonarcloud-quality-gate-rules)
- [UAT and Pre-Production Rules](#uat-and-pre-production-rules)

---

## Branch

| Branch    | Purpose                                    | Who Merges Here         | Deploys To          |
| --------- | ------------------------------------------ | ----------------------- | -------------------- |
| `main`    | Production-ready code                      | From `uat` (PR approval) | Vercel Production   |
| `uat`     | User Acceptance Testing                    | From `test` (PR approval) | Vercel Preview (UAT) |
| `test`    | Integration testing for combined features  | From `feature/*` branches (PR) | Vercel Preview (TEST) |
| `feature/*` | Individual feature or task development   | Developer               | Local dev server     |

---

## Branch Flow

```
feature/login ──┐
feature/signup ─┤
feature/dashboard ─┼──► test ──► uat ──► main
feature/profile ───┘
```

**Key Rules:**

1. **Never** commit directly to `main`, `uat`, or `test`.
2. Always create a **feature branch** from the latest `test` branch.
3. Merge direction is always **forward**: `feature → test → uat → main`.
4. Never merge backward (e.g., `main` into `feature`).
5. `test → uat` is **PR-based** (no automatic merge).
6. `uat → main` is **PR-based** with UAT Vercel links for manual approval.

---

## How to Work with Feature Branches

### 1. Create a Feature Branch

```bash
# Make sure you're on the latest test branch
git checkout test
git pull origin test

# Create your feature branch
git checkout -b feature/your-feature-name
```

### 2. Work on Your Feature

```bash
# Make changes, then stage and commit
git add .
git commit -m "feat: description of what you did"
```

### 3. Push Your Feature Branch

```bash
git push origin feature/your-feature-name
```

### 4. Create a Pull Request (PR)

- Go to GitHub and create a PR from `feature/your-feature-name` → `test`.
- Assign reviewers and wait for approval.
- **Do not merge your own PR** unless permitted by the team.

### 5. After PR is Approved and Merged to `test`

- The pipeline runs one of two orchestrators depending on repo configuration:
  - **FE Single** (`master-pipeline-fe-single.yml`)
  - **FE Multi** (`master-pipeline-fe-multi.yml`)
- **Version tags are generated automatically**:
  - FE Single uses global tags (`test-v*`, `main-v*`) with numeric incrementing (`1.0.0.0`, `1.0.0.1`, ...).
  - FE Multi uses per-system streams (`test-<system>-v*`, `main-<system>-v*`).
- `test` deploys to Vercel preview and auto-creates **PR `test → uat`** with deployment links and release evidence.
- `uat` deploys to Vercel preview and auto-creates **PR `uat → main`** with deployment links and release evidence.
- `main` deploys to Vercel production, updates repository **About → Website** homepage URL, then builds/pushes Docker images (GHCR).
- Pipeline status notifications are sent to Slack/Discord and include deployment links and status context.

---

## CI/CD & Deployment

This repo uses GitHub Actions and Vercel. Deployments are fully automated — you never need to deploy manually.

### Active Workflow Model

- Reusable workflows are composed by master orchestrators for FE Single and FE Multi.
- Promotion PRs are created by `promotion.yml` with deployment evidence and quality gate summaries.
- Deployments are handled by `vercel-deploy.yml` (preview for `test`/`uat`, production for `main`).
- Versioning is handled by `versioning.yml` with stream-aware semantic increments.
- Notifications are handled by `notifications.yml` and can include status images.
- Auto-revert on failed push pipelines is enabled (with skip markers support).

### What Happens at Each Branch

| Branch | What Runs | What Deploys |
|--------|-----------|--------------|
| `feature/*` → `test` (PR) | Frontend checks via reusable workflows; SonarCloud gate (multi) | None |
| `test` (push) | CI checks, version tag (single/global or multi/per-system), preview deploy, promotion PR to `uat`, notifications | TEST preview URLs |
| `uat` (push) | CI checks, preview deploy, promotion PR to `main`, notifications | UAT preview URLs |
| `main` (push via PR) | CI checks, production gate, production deploy, About homepage update, main release tag(s), GHCR build/push, notifications | Production URLs |

### Vercel Preview Links

When code reaches `test` and `uat`, each active project gets a Vercel preview URL. These links appear in promotion PRs and pipeline notifications.

### Production Homepage Update

On successful `main` deployment, the pipeline updates repository **About → Website** to the resolved production URL (requires `GH_PR_TOKEN`/`GHPR_TOKEN` with repository admin write capability).

### Required Setup (One-Time)

See the root [README.md](./README.md) for:
- Vercel project creation and configuration
- GitHub secrets to add
- How to disable Vercel's auto-deploy

---

## How to Fix Merge Conflicts

### Step 1: Identify the Conflict

When you see a message like this after pulling or merging:

```
CONFLICT (content): Merge conflict in src/App.jsx
Automatic merge failed; fix conflicts and then commit the result.
```

### Step 2: Open the Conflicting File

Look for conflict markers in the file:

```jsx
<<<<<<< HEAD
// Your current branch's code
const title = "My Version";
=======
// Incoming branch's code
const title = "Their Version";
>>>>>>> feature/other-feature
```

### Step 3: Resolve the Conflict

Choose one of the following:

- **Keep your changes** — delete the incoming code and the conflict markers.
- **Keep their changes** — delete your code and the conflict markers.
- **Combine both** — manually merge the two versions together.

**After resolving**, the file should look clean with no conflict markers:

```jsx
const title = "Combined or Chosen Version";
```

### Step 4: Mark as Resolved and Commit

```bash
# Stage the resolved file
git add src/App.jsx

# Commit the merge resolution
git commit -m "fix: resolve merge conflict in App.jsx"
```

### Step 5: Push the Changes

```bash
git push origin your-branch-name
```

### Using VS Code to Resolve Conflicts

VS Code highlights conflicts and provides buttons:

- **Accept Current Change** — keeps your code
- **Accept Incoming Change** — keeps the other branch's code
- **Accept Both Changes** — keeps both (you may need to clean up)
- **Compare Changes** — shows a side-by-side diff

Use the Source Control panel (Ctrl+Shift+G) to see all conflicting files.

---

## How to Prevent Merge Conflicts

### 1. Pull Frequently

```bash
# Before starting work each day
git checkout test
git pull origin test
git checkout feature/your-feature-name
git merge test
```

This keeps your feature branch up to date with the latest changes.

### 2. Keep Feature Branches Short-Lived

- Work on small, focused tasks.
- Merge back to `test` as soon as the feature is complete and reviewed.
- Long-lived branches = more conflicts.

### 3. Communicate with Your Team

- Let teammates know which files you're working on.
- Avoid having multiple people edit the same file at the same time.
- Use the PR description to explain what files were changed.

### 4. Use the Correct Base Branch

- Always branch off from `test` (not `main` or `uat`).
- This ensures your branch has the latest integrated code.

### 5. Don't Skip Branches

```
✅ Correct:   feature → test → uat → main
❌ Wrong:     feature → main (skipping test and uat)
❌ Wrong:     feature → uat (skipping test)
```

### 6. Rebase Instead of Merge (Optional, Advanced)

```bash
# Instead of merging test into your feature branch
git checkout feature/your-feature-name
git rebase test
```

Rebasing replays your commits on top of the latest `test`, producing a cleaner history. **Only rebase branches that haven't been shared/pushed yet**, or coordinate with your team.

---

## Common Scenarios & Solutions

### Scenario 1: "I accidentally committed to `test` directly"

```bash
# Undo the last commit (keep changes in working directory)
git reset --soft HEAD~1

# Create a feature branch and commit there
git checkout -b feature/accidental-work
git add .
git commit -m "feat: moved accidental commit to feature branch"
git push origin feature/accidental-work
```

Then create a PR from `feature/accidental-work` → `test`.

### Scenario 2: "My feature branch is behind `test`"

```bash
git checkout feature/your-feature-name
git pull origin test
# Resolve any conflicts if they appear
git push origin feature/your-feature-name
```

### Scenario 3: "I merged the wrong branch"

```bash
# Undo the merge (if not pushed yet)
git merge --abort    # if merge is still in progress
# OR
git reset --hard HEAD~1   # if merge was already committed but NOT pushed
```

> **Warning:** `git reset --hard` will discard changes. Only use if you haven't pushed yet.

### Scenario 4: "Two people edited the same file"

This is the most common cause of merge conflicts. To resolve:

1. Pull the latest `test` into your feature branch.
2. Open the conflicting files and resolve the markers.
3. Test your code to make sure nothing is broken.
4. Commit and push.

### Scenario 5: "I need to update my PR with the latest test changes"

```bash
git checkout feature/your-feature-name
git pull origin test
# Resolve conflicts if any
git push origin feature/your-feature-name
```

The PR on GitHub will automatically update.

---

## Quick Reference Commands

| Action                          | Command                                          |
| ------------------------------- | ------------------------------------------------ |
| Create feature branch           | `git checkout -b feature/name`                   |
| Switch branches                 | `git checkout branch-name`                        |
| Pull latest changes             | `git pull origin branch-name`                     |
| Push your branch                | `git push origin feature/name`                    |
| Merge test into your branch     | `git merge test` (while on your feature branch)   |
| Abort a failed merge            | `git merge --abort`                               |
| See current branch              | `git branch`                                      |
| See all branches                | `git branch -a`                                   |
| See conflict status             | `git status`                                      |
| View commit history             | `git log --oneline --graph`                       |

---

## Golden Rules

1. **Always branch from `test`** for new features.
2. **Always create a PR** — never push directly to `test`, `uat`, or `main`.
3. **Pull `test` into your feature branch daily** to stay up to date.
4. **Resolve conflicts locally** before pushing.
5. **Test your code** after resolving conflicts to make sure nothing broke.
6. **Keep branches small and focused** — one feature per branch.
7. **Delete your feature branch** after it's merged to keep the repo clean.

---

## Platform Governance Rules

### Approved Tech Stack

- **Front-End:** React (Next.js framework)
- **Back-End:** Node.js
- **Mobile:** React Native (TBC)
- **Database:** Supabase

### GitHub Organization and API Center Governance

1. **RBAC is mandatory:** Tribe members have write access only to their assigned repositories; admin access is restricted to DevOps and Tech Leads.
2. **API standardization is required:** APIs across Tribes 1-6 must follow a central OpenAPI/Swagger contract.
3. **No direct database cross-access:** Tribes must communicate only through the API Center/Gateway.
4. **Semantic API versioning is required:** all APIs use explicit versions (for example `v1`, `v2`) to avoid breaking clients.

### API Naming Convention

Use ownership-first names so responsibility is obvious:

- Shared API: `apicenter-shared-<domain>-api`
- Tribe-owned API: `tribe<id>-<domain>-api`

Examples:

- `apicenter-shared-auth-api`
- `apicenter-shared-payments-api`
- `tribe3-profile-api`
- `tribe1-orders-api`

Rules:

1. Use lowercase kebab-case only.
2. Keep environment out of repo name (no `-dev`, `-uat`, `-prod`).
3. Keep API major version in endpoint path (`/v1`, `/v2`) instead of repo name.

### API URL Path Convention

- Shared API path: `/api/shared/{domain}/v{major}/...`
- Tribe-owned API path: `/api/tribe{n}/{domain}/v{major}/...`

Examples:

- `/api/shared/auth/v1/login`
- `/api/shared/payments/v1/charge`
- `/api/tribe3/profile/v1/users/{id}`
- `/api/tribe1/orders/v2/{orderId}`

Rules:

1. Version segment is required (`v1`, `v2`).
2. Use nouns for resources (`/users`, `/orders`).
3. Do not include environment in API path (`/uat`, `/prod` not allowed).

### Why Versioning Is Mandatory

1. Prevents breaking existing consumers when APIs evolve.
2. Allows parallel operation of old/new contracts during migration (`v1` and `v2`).
3. Enables tribe teams to release independently without forced synchronized client updates.
4. Improves rollback safety by preserving prior stable API contracts.

### Source Control Governance

1. **Least privilege:** developers cannot approve their own pull requests.
2. **Branch protection:** direct commits to `main`/production branches are prohibited.
3. **PR merge requirements:** at least one peer review and all required pipeline checks must pass.
4. **Conventional Commits are enforced:** `feat:`, `fix:`, `chore:`, etc., for changelog automation.

---

## CI/CD Test Case Rules

### General Rules

1. Test pass rate must be **100%**.
2. Coverage must be **>= 80%**.
3. No `console.log` in production code.
4. Maximum of 3 retries for flaky tests.
5. No linting errors.
6. TypeScript strict mode enabled.
7. No critical/high npm vulnerabilities.
8. No hardcoded secrets.
9. All checks must pass before merge.

### Backend Pipeline Rules

1. API tests must pass (Jest).
2. API response time must stay under the agreed threshold (set project-specific SLO in pipeline config).
3. Database migration validation (to be finalized).

### Mobile Pipeline Rules

1. Jest tests must pass.
2. App build must succeed (both platforms for React Native, or Android for Kotlin-only apps).
3. APK size must be under 100 MB.

---

## SonarCloud Quality Gate Rules

### Required Conditions (Enforced)

1. Coverage on new code: **>= 80%**
2. Duplicated lines on new code: **<= 3%**
3. Maintainability rating: **A**
4. Reliability rating: **A**
5. Security rating: **A**
6. Security hotspots reviewed: **100%**

### Enforcement Rules

1. SonarCloud scan must run on PR and target branches.
2. Quality Gate must pass.
3. PR merge is blocked when Quality Gate fails.

---

## UAT and Pre-Production Rules

### UAT (Selenium) Governance

1. Focus on **Critical User Journeys (CUJs)** (for example login, checkout, add-to-cart).
2. Use only synthetic test data (no real customer data).
3. Validate cross-browser support for primary browsers (Chrome and Safari/WebKit unless project defines others).
4. **Fix or Revert policy:** failing E2E blocks deployment; no force-merge.

### Pre-Production Governance

1. **Environment parity:** staging must mirror production infrastructure.
2. **Data sanitization:** PII must be scrubbed/anonymized in copied datasets.

### Pre-Production Rules

1. Deployment freeze during active UAT sessions.
2. Staging database reset/sync with sanitized production data at least once per sprint.
3. Post-deploy smoke test must pass before deep testing.
