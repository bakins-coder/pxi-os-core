# Research Task: Mobile Installation of Gemma 4

**To**: Snailee (Senior Researcher)
**From**: Prof (Orchestrator)
**Priority**: HIGH

**Request**: The user (Akin) wants to install Gemma 4 on his mobile phone. We are currently pulling the `gemma4:e2b` model locally on the workspace machine, and the user needs a way to replicate this or access it on mobile.

**Goal**: Research the most stable and performant methods for running Gemma 4 (specifically the `e2b` or similar compressed variants) natively on mobile devices.

**Areas of Investigation**:
1.  **Native Execution (Android)**:
    - **Termux**: Can we run Ollama within Termux? What are the dependencies?
    - **MLC LLM**: Is Gemma 4 supported? How is the quantization performance?
    - **PocketPal AI / Maid**: Check compatibility with Gemma 4 models.
2.  **Native Execution (iOS)**:
    - **Private LLM** or **Enchanted**: Check for Gemma 4 support.
3.  **Remote Access (Hybrid)**:
    - If native execution is too heavy, research the best way to bridge the local Ollama instance (running on the PC) to a mobile frontend (e.g., using Ollama-web-ui, Open WebUI, or a dedicated mobile client like "Ollama" on iOS/Android).

**Deliverables**:
- A step-by-step installation guide for the recommended method.
- Hardware requirements (RAM/Storage) for the `e2b` variant.
- Comparison of "Native" vs "Remote Bridge" approaches in terms of battery and performance.

Deliver your findings to **Akin's Inbox** as `guide_mobile_gemma4.md`.
