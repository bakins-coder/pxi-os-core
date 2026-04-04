# Team Inbox: URGENT Data Integrity Fix (Mrs. Akinde vs Mrs. Adesua)

**Task ID**: `XQ-INTEGRITY-001-EXECUTION`
**Priority**: Critical (Data Loss/Privacy)
**Stakeholder**: Prof (Orchestrator)
**Approved Plan**: `Archive/TASK-integrity-testing-xquisite.md`

## 1. Fixit (System Repair Specialist)
- **Objective**: Correct the "Mrs. Akinde" invoice mismatch.
- **Requirement**: 
    - Identify why clicking "View Invoice" for **Mrs. Akinde** resolves to **Mrs. Adesua's** data.
    - Audit `FulfillmentHub.tsx` and `useDataStore.ts` for any fuzzy name matching logic.
    - **Surgical Fix**: Enforce strict `invoiceId` or `contactId` mapping to ensure data isolation between these two customers.
- **Deliverable**: A verified code fix that ensures Mrs. Akinde's invoice correctly displays HER data.

## 2. Nova (Web Visualization)
- **Objective**: Verify visual accuracy and metadata rendering for Mrs. Akinde.
- **Requirement**: 
    - Once Fixit has applied the mapping fix, verify that the `InvoicePrototype.tsx` and `WaveInvoiceModal` display the correct customer metadata (Name, Address, Balance).
    - Ensure no cached "Adesua" data remains in the view after the correction.
- **Deliverable**: Visual confirmation that Mrs. Akinde's invoice is restored to its correct state.

---
*Please acknowledge tasks by moving them to your respective "In Progress" folders. This is a critical blocker.*
