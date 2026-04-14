# Hardware Audit Report: Gemma 4 Compatibility
**Assigned to**: Snailee (Senior Researcher)
**Target**: Akin's Personal Workstation

## System Specifications
- **GPU**: AMD Radeon (TM) Graphics (Integrated)
- **VRAM**: 2 GB (Theoretical maximum)
- **System RAM**: 16 GB (14.8 GB usable)
- **Ollama Engine**: 0.4.7 (Update in progress to 0.20.x+)

## Gemma 4 Feasibility Matrix

| Variant | Size (4-bit) | Status | Recommendation |
| :--- | :--- | :--- | :--- |
| **Gemma 4: E2B** | ~1.5 GB | **Green** | Primary model for edge tasks and real-time coding. Fits in VRAM/RAM easily. |
| **Gemma 4: E4B** | ~2.8 GB | **Yellow** | Functional via RAM offloading. Slower, but viable for complex reasoning. |
| **Gemma 4: 26B (MoE)** | ~16 GB | **Red** | **NOT RECOMMENDED**. Likely exceeds available system memory and will cause extreme lag. |
| **Gemma 4: 31B (Dense)** | ~20 GB | **Red** | **INCOMPATIBLE**. Exceeds total system RAM. |

## Snailee's Conclusion
The workstation is best suited for the **E2B** and **E4B** variants. Attempting to run the 26B or 31B models without dedicated high-memory GPU hardware (e.g., RTX 3090/4090) or at least 32GB-64GB of system RAM is not advised.

I have updated **Nexus** to focus on the `E2B` and `E4B` deployments for stable cross-project access.
