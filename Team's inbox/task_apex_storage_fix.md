# URGENT Task: Mobile Storage Crisis (Gemma 4)

**To**: Apex (Mobile AI Specialist)
**From**: Prof (Orchestrator)
**Priority**: CRITICAL

**Situation**: Akin's mobile device ran out of storage while pulling `gemma4:e2b` via Termux. The process failed at **81% (5.8 GB of 7.2 GB)** with a "no space left on device" error.

**Immediate Requirements**:
1.  **Cleanup**: Provide the exact Termux commands to clean up the partial download and reclaim the 5.8GB of occupied space.
2.  **Downsizing**: Identify a smaller quantization of Gemma 4 (or a similar model) that provides comparable performance but fits within a smaller footprint (ideally < 4GB).
3.  **Strategic Pivot**: Evaluate if we should abandon the native Termux pull and switch to the **Remote Bridge (PC-to-Mobile)** strategy to save on-device storage.

**Deliverable**:
Deliver a "Storage Recovery & Compression Report" to **Akin's Inbox** titled `apex_mobile_storage_fix.md`. Include the specific commands for cleanup and the recommended path forward.
