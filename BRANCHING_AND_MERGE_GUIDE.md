# Branching Strategy & Merge Conflict Guide

## Table of Contents

- [Branch Overview](#branch-overview)
- [Branch Flow](#branch-flow)
- [How to Work with Feature Branches](#how-to-work-with-feature-branches)
- [How to Fix Merge Conflicts](#how-to-fix-merge-conflicts)
- [How to Prevent Merge Conflicts](#how-to-prevent-merge-conflicts)
- [Common Scenarios & Solutions](#common-scenarios--solutions)

---

## Branch Overview

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

- The pipeline creates a **version tag** on every merge to `test` (format: `test-vYYYY.MM.DD.RUN-SHA`).
- The pipeline deploys each project to **TEST Vercel** and collects deployment links.
- A **PR is auto-created** from `test → uat` with TEST deployment links.
- After merging to `uat`, each project is deployed to **UAT Vercel**.
- A **PR is auto-created** from `uat → main` with UAT deployment links.
- Review links and merge manually for production release.

---

## CI/CD & Deployment

This repo uses GitHub Actions and Vercel. Deployments are fully automated — you never need to deploy manually.

### What Happens at Each Branch

| Branch | What Runs | What Deploys |
|--------|-----------|--------------|
| `feature/*` → `test` (PR) | Lint, Test, Build, SonarCloud | Nothing |
| `test` (push) | CI + Vercel TEST deploy + create PR to `uat` | TEST preview URLs (per project) |
| `uat` (push) | CI + Vercel Preview deploy | UAT preview URLs (per project) |
| `main` (push via PR) | CI + Production Gate + Vercel Prod deploy | Production URLs |

### Vercel Preview Links

When code reaches `uat`, each project gets a Vercel preview URL. These links appear in the auto-created PR (`uat → main`). Use them to test before approving for production.

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
