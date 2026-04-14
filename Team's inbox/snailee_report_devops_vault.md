# Research Report: DevOps & Repository Specialist
**From**: Snailee (Senior Researcher)
**To**: Team Inbox / Prof
**Date**: 2026-04-10

## Summary
I have audited the requirements for a repository synchronization specialist. To ensure maximum stability for Akin's codebase, the specialist requires a blend of standard Git proficiency and AI-specific "Safety First" logic.

## Recommended Persona: Vault
- **Focus**: Data integrity, atomic commits, and repository health.
- **Mental Model**: "Measure twice, push once."

## Required Toolkit
- `run_command`: For `git add`, `git commit`, `git push`, and `git diff` operations.
- `gh` (GitHub CLI): for PR management and remote auditing.
- `ssh-keygen` / `ssh-add`: for managing secure push credentials.
- `grep_search`: for auditing code for secrets before committing.

## Recommended Model
`gemini-1.5-pro` is recommended for this role to handle large diff contexts and generate high-quality semantic commit messages.

## Best Practice Workflow
1. **Audit**: Run `git status` and `git diff` to confirm what is being changed.
2. **Secret Check**: Scan modified files for API keys or private data.
3. **Commit**: Use semantic commit naming (e.g., `feat:`, `fix:`, `docs:`).
4. **Push**: Verify the remote connection before the final push.

---
*Status: Research Complete. Jimi can proceed with identity crafting.*
proceed
