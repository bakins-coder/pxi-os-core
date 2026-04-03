# Team Inbox: Resolve Login Failure for Olaitan (Xquisite Staff)

**Task ID**: `XQ-LOGIN-002`
**Priority**: Urgent
**Stakeholder**: Prof (Orchestrator)
**Confirmed Context**: Olaitan's Staff ID is **XQ-0012**.

## 1. Snailee (Senior Researcher)
- **Objective**: Verify the account status of **XQ-0012**.
- **Requirement**: Look up Staff ID `XQ-0012` in the `employees` and `profiles` tables. Confirm if an email is associated with this ID (e.g., `xq-0012@xquisite.local`).
- **Deliverable**: A summary of her account activation status and associated email for Fixit.

## 2. Fixit (System Repair Specialist)
- **Objective**: Fix the authentication logic for **XQ-0012**.
- **Requirement**: Reproduce the login failure using Staff ID `XQ-0012`. Investigate `src/store/useAuthStore.ts` to ensure the `get_email_by_staff_id` RPC is resolving this specific ID correctly.
- **Deliverable**: A verified fix for the login flow.

---
*Please acknowledge tasks by moving them to your respective "In Progress" folders or updating this file.*
