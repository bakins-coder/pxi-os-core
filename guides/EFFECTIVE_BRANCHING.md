# Effective Branching Strategy (GitHub Flow)

To work in parallel without chaos, follow these rules. This strategy is known as **GitHub Flow**.

## 1. The "Main" Rule
*   **`main` is sacred.** The code in the `main` branch should *always* be deployable (it shouldn't crash).
*   **Never commit directly to `main`.** Always use a branch.

## 2. Naming Your Branches
Use prefixes to categorize your work. This makes the history clean and readable.

*   `feat/` - A new feature (e.g., `feat/user-login`, `feat/dark-mode`)
*   `fix/` - A bug fix (e.g., `fix/header-alignment`, `fix/broken-link`)
*   `docs/` - Documentation only (e.g., `docs/update-readme`)
*   `style/` - Formatting, missing semi-colons, no code change (e.g., `style/prettify-css`)
*   `refactor/` - Restructuring code without changing behavior

**Example**:
```powershell
git checkout -b feat/shopping-cart
```

## 3. Keep Branches Small & Short-Lived
**The #1 cause of conflicts is a "Long Running Branch".**

*   **Bad**: Creating a branch `feat/entire-website-redesign` and working on it for 3 weeks. By the time you try to merge, the world has changed, and you will have 500 conflicts.
*   **Good**: Break it down.
    *   `feat/redesign-header` (Day 1 -> Merge)
    *   `feat/redesign-footer` (Day 2 -> Merge)
    *   `feat/redesign-hero` (Day 3 -> Merge)

**Goal**: Try to merge your branch within **48 hours**.

## 4. The "Morning Pull" (avoid conflicts)
Every day before you start coding, pull the latest changes from the cloud into your local computer *and* your branch.

```powershell
# 1. Switch to main and get latest
git checkout main
git pull

# 2. Go back to your branch
git checkout feature/my-cool-feature

# 3. Merge main into your branch
git merge main
```

**Why?** This forces you to solve small conflicts *now* (on your machine), instead of discovering a huge conflict *later* (on GitHub).

## 5. Summary Checklist
1.  [ ] Sync with `main` before starting.
2.  [ ] Create a branch with a descriptive name (`feat/...`).
3.  [ ] Make small commits (`git commit -m "added button"`).
4.  [ ] Push to cloud (`git push`).
5.  [ ] Open Pull Request when ready.
6.  [ ] Delete branch after merging.
