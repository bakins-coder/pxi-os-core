# Directive: Gemma 4 Local Infrastructure Setup
**Assigned to**: Nexus (Systems Architect)
**Status**: Pending Research (Snailee)

## Objective
Establish the local service engine for Gemma 4 and ensure it is accessible system-wide.

## Technical Tasks
1. **Ollama Deployment**:
   - Verify if Ollama is installed on the host system.
   - If missing, download and install the latest Windows version.
2. **Model Retrieval**:
   - Pull the `gemma4:e2b` (Edge) and `gemma4:e4b` variants initially.
   - Once Snailee confirms VRAM compatibility, pull the workstation models (`26b` or `31b`).
3. **API Exposure**:
   - Ensure the server listens on `http://localhost:11434`.
   - Test connectivity with a basic `/v1/models` request.

## Collaboration
- Await Snailee's hardware audit before pulling larger models.
- Coordinate with **Fixit** once the server is stable.
