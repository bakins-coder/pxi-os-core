# Multi-Device Development Workflow

This guide covers how to effectively work on **Pxi OS Core** (Paradigm Vibe Core) across multiple devices (e.g., a desktop and a laptop, or developing on PC and testing on mobile).

## 1. Initial Setup on the Second Device

If you haven't set up the second device yet:

1.  **Install Prerequisites**: Ensure Node.js and Git are installed.
2.  **Clone the Repository**:
    ```powershell
    git clone https://github.com/bakins-coder/pxi-os-core.git
    cd pxi-os-core
    ```
3.  **Install Dependencies**:
    ```powershell
    npm install
    ```
4.  **Setup Environment Variables**:
    *   Create a `.env.local` file in the root directory.
    *   Copy the contents from your main device's `.env.local` to this new file.
    *   *Note: `.env.local` contains secrets and is NOT synced by Git for security.*

## 2. Synchronizing Code (The "Handoff")

When switching devices, use Git to sync your progress.

### On Device A (Finishing a session)
Before you leave this device, save your work to the cloud:
```powershell
# 1. Stage all changes
git add .

# 2. Commit with a message
git commit -m "WIP: Description of what I did"

# 3. Push to GitHub
git push
```

### On Device B (Starting a session)
Before you start coding, get the latest changes:
```powershell
# 1. Pull changes
git pull

# 2. Start the server
npm run dev
```

> **Tip**: If you forgot to push from Device A and are now at Device B, you won't have your latest code. Always push when you stand up!

## 3. Simultaneous Testing (Local Network)

If you want to code on your **PC** but verify the PWA on your **Phone** or **Laptop** simultaneously without pushing/pulling code:

1.  **On the Coding Device (Host)**:
    Run the dev server with the host option to expose it to your local network:
    ```powershell
    npm run dev -- --host
    ```
    *The terminal will show a "Network" URL, e.g., `http://192.168.1.100:5173/`.*

2.  **On the Testing Device**:
    *   Ensure both devices are on the same Wi-Fi.
    *   Open the browser and visit the Network URL shown above.

## 4. Database Sync (Supabase)

*   **Data**: Your database is hosted on Supabase (cloud). Data added on one device is instantly available on the other.
*   **Schema Changes**: If you modify the database structure (tables, columns) via the Supabase Dashboard, those changes apply everywhere immediately.
*   **SQL Files**: If you modify `supabase_schema.sql`, commit and push it so the other device has the record of the change.

## 5. Troubleshooting Sync Issues

If `git pull` fails because you have "uncommitted changes" on the current device:
*   **If you want to keep your local changes**: `git stash`, then `git pull`, then `git stash pop`.
*   **If you want to overwrite local changes**: `git reset --hard origin/main`.

## 6. AI Assistant Setup (MCP Servers)

If you use AI assistants with MCP (Model Context Protocol) servers (like the Supabase MCP server):

*   **Config Locality**: MCP server configurations are **local** to your machine and are **not** synced via Git.
*   **Setup on New Device**: When setting up a new device, you must manually add the MCP server configuration to the AI assistant's settings on that machine.
*   **Consistency**: Ensure the credentials (API keys, URLs) match those used on your other devices for a consistent experience.

