# Directive: Gemma 4 Cross-Project Integration
**Assigned to**: Fixit (CLI Specialist)
**Status**: Pending Infrastructure (Nexus)

## Objective
Ensure all local projects can discover and utilize the running Gemma 4 instance.

## Technical Tasks
1. **Environment Variables**:
   - Add `OLLAMA_HOST=http://localhost:11434` to the system environment variables or centralized `.env`.
   - Update project-specific configs to prioritize the local LLM for dev tasks.
2. **Library Management**:
   - Ensure `pip install ollama` and `npm install ollama` are part of the standard project onboarding script.
3. **Connectivity Verification**:
   - Run a diagnostic script across each active workspace to verify they can "peek" at the running models.

## Collaboration
- Report any "Blocked" states to **Prof**.
