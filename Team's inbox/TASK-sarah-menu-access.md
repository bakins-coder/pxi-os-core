# Team Inbox: Resolve Menu Visibility for Sarah (Xquisite Staff)

**Task ID**: `XQ-UI-003`
**Priority**: Urgent
**Stakeholder**: Prof (Orchestrator)
**Confirmed Context**: Staff member Sarah cannot see "Orders" or "Menu Items" to create orders.

## 1. Snailee (Senior Researcher)
- **Objective**: Identify the "Orders" and "Menu Items" sidebar components. (DONE)
- **Findings**: Sarah Okelezo (user_id: `30e5ee05-ee88-4e63-a1e9-74acb559227b`) was missing her `organization_id` in `profiles`, and her role was `Employee`, which had no access.

## 2. Atlas (Knowledge Architect)
- **Status**: COMPLETED
- **Action**: Updated Sarah's database profile (User: `30e5ee05-ee88-4e63-a1e9-74acb559227b`). Linked her to Xquisite (`10959119-72e4-4e57-ba54-923e36bba6a6`) and assigned the `Kitchen Manager` role.

## 3. Nova (Web Visualization)
- **Status**: COMPLETED
- **Action**: Added `Role.KITCHEN_MANAGER` to the codebase:
    - `src/components/Layout.tsx`: Granted sidebar visibility for **Inventory** and **Orders & Invoicing**.
    - `src/App.tsx`: Granted route access to **Inventory**, **Catering**, **Bakery**, and **Portion Monitor**.

---
**Verification**: Sarah should now see the "Orders & Invoicing" and "Inventory" items in her sidebar and have full permissions to manage them.

---
*Please acknowledge tasks by moving them to your respective "In Progress" folders.*
