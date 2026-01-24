# Approval Workflow (Pull Requests)

This workflow ensures that code changes are reviewed and approved by a Senior Developer before they modify the main codebase.

## The Golden Rule
**NEVER push directly to `main`.** Always work on a separate branch.

## Step-by-Step Process

### 1. Create a "Feature Branch"
Before you start coding, create a safe space for your changes:

```powershell
# Make sure you have the latest code
git checkout main
git pull

# Create a new branch named after your task
git checkout -b feature/improved-login
```

*Examples of branch names: `fix/button-color`, `feat/new-dashboard`, `update/readme`.*

### 2. Make Your Changes
Edit files, add code, and save as usual.

### 3. Commit and Push
When you are ready to send your work to the cloud:

```powershell
git add .
git commit -m "Added new login form styles"

# Push the branch (NOT main)
git push -u origin feature/improved-login
```

### 4. Create a Pull Request (PR)
1.  Go to the GitHub repository page.
2.  You will see a yellow banner: "feature/improved-login had recent pushes". Click **Compare & pull request**.
3.  **Title**: Describe what you did.
4.  **Reviewers**: On the right sidebar, click **Reviewers** and select the Senior Developer.
5.  Click **Create pull request**.

### 5. Review & Approval (The Senior Dev Role)
The Senior Developer will:
1.  Receive a notification.
2.  View the "Files changed" tab to see exactly what lines you modified.
3.  **Approve**: If it looks good.
4.  **Request Changes**: If there are bugs or style issues. You must fix these and push again to the *same branch*.

### 6. Merge
Once approved, the "Merge pull request" button turns green. Click it to combine your work into `main`.

### 7. Cleanup
Switch back to main and get the updated code:
```powershell
git checkout main
git pull
# Delete the old branch
git branch -d feature/improved-login
```
