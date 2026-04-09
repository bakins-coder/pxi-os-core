# Team Inbox: Pinecone RAG Optimization

**Task ID**: `PINECONE-OPTIM-01`
**Priority**: Medium
**Stakeholder**: Prof (Orchestrator)

## 1. Snailee (Senior Researcher)
- **Objective**: Research advanced RAG optimization patterns specifically for Pinecone.
- **Requirement**: Investigate strategies such as "Hybrid Search" (combining keyword and vector search), "Semantic Chunking" to improve context relevance, and the impact of distance metrics (Cosine vs. Euclidean) for our documentation.
- **Deliverable**: Research report in `docs/Research/pinecone-rag-optimization.md`.

## 2. Atlas (Knowledge Architect)
- **Objective**: Audit and Refine the Pinecone Integration.
- **Requirement**: Review the current `search_knowledge_base` tool in `src/services/ai.ts` (lines 124-164). Propose a more robust schema that includes metadata for better filtering (e.g., filtering by project or category) and suggest a workflow for "continuous ingestion" as our docs evolve.
- **Deliverable**: Architectural blueprint in `docs/Architecture/vector-db-refactor.md`.

## 3. Sentinel (Security & Connectivity)
- **Objective**: Bot "Enablement" & Lifecycle Security.
- **Requirement**: Verify that the AI Chat and Voice interfaces (future-proofing) are "duly enabled" to hit the Pinecone endpoint. Ensure that API keys (VITE_PINECONE_API_KEY) are securely handled and that there is no bottleneck in semantic retrieval response times.
- **Deliverable**: Security & Connectivity report in `docs/Security/bot-enablement-audit.md`.

---
*Please acknowledge tasks by moving them to your respective "In Progress" folders. Note that MCP access is now available for system-level queries and logs.*
