# Team Inbox: Multi-Vertical Support (Xquisite Bakery Expansion)

**Task ID**: `XQ-MULTIVERT-001`
**Priority**: High
**Stakeholder**: Prof (Orchestrator)

## 1. Snailee (Senior Researcher)
- **Objective**: Research the "Hybrid Catering-Bakery" model. 
- **Requirement**: How should the system handle shared inventory but separate "Ops" workflows? (e.g., Catering is event-based, Bakery is order-based).
- **Deliverable**: Research report in `docs/Research/hybrid-catering-bakery.md`.

## 2. Atlas (Knowledge Architect)
- **Objective**: Propose a schema update for the `organizations` table.
- **Requirement**: Support `primary_type` and `secondary_types` (array). Ensure `industry_profiles.ts` can resolve multiple profiles for a single organization.
- **Deliverable**: SQL Migration snippet and updated `OrganizationSettings` interface definition.

## 3. Nova (Web Visualization)
- **Objective**: Design the Sidebar integration for multiple "Hubs".
- **Requirement**: If an entity is both Catering and Bakery, both "Catering Ops" and "Bakery Ops" should appear in the Sidebar with their respective icons/nomenclature.
- **Critical Testing Task**:
    - [ ] **Invoice Identity Check**: For both **Cuisine Orders** and **Banquet Orders**, click "View Invoice" for 3-5 different customers.
    - [ ] **Verification**: Confirm that the **Customer Name** on the invoice strictly matches the **Customer Name** on the dashboard card.
- **Deliverable**: Visual mock-up and testing confirmation in `docs/Walkthrough/invoice-identity-verification.md`.

---
*Please acknowledge tasks by moving them to your respective "In Progress" folders.*
