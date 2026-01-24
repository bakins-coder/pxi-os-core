# Cloud Development with GitHub Codespaces

**GitHub Codespaces** provides a complete, secure development environment in the cloud. You can code, run, and debug your project from any browser without installing anything on your local machine.

## 1. Starting a Codespace

1.  Go to the repository on GitHub: [bakins-coder/pxi-os-core](https://github.com/bakins-coder/pxi-os-core).
2.  Click the green **Code** button.
3.  Switch to the **Codespaces** tab.
4.  Click **Create codespace on main**.

GitHub will set up a virtual machine, install Node.js, and run `npm install` automatically (this uses the `.devcontainer/devcontainer.json` file we added).

## 2. Using the Cloud Environment

Once the interface loads (looks exactly like VS Code):

1.  **Terminal**: Open a terminal with `` Ctrl + ` ``.
2.  **Start App**: Run `npm run dev`.
3.  **Preview**: A popup will appear saying "Your application is running on port 5173". Click **Open in Browser**.

## 3. Environment Variables (Secrets)

Your `.env.local` file is NOT in the cloud for security. You must add these secrets to Codespaces:

1.  In the GitHub repository, go to **Settings** > **Secrets and variables** > **Codespaces**.
2.  Click **New repository secret**.
3.  Add the keys from your local `.env.local`:
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
    *   etc.

Once added, restart your Codespace to apply them.

## 4. Why use this?

*   **Zero Setup**: Work from a library computer, an iPad, or a friend's laptop.
*   **Consistent**: The environment is always the same, eliminating "it works on my machine" bugs.
*   **Fast**: Uses powerful cloud servers for building and installing dependencies.

## 5. Git & Collaboration (Branches & PRs)

**Yes, absolutely.** Codespaces is just VS Code running on a server. You have full access to Git.

*   **Branches**: Run `git checkout -b feature/my-branch` in the terminal just like on your PC.
*   **Pull Requests**: You can push your branch and open a PR from within Codespaces.
*   **Extensions**: The "GitHub Pull Requests" extension is available, allowing you to review and comment on code without leaving the editor.
