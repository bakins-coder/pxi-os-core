---
description: Formal discovery and setup workflow for new multi-tenant workspaces with focus on Security and Compliance.
---

# /workspace-setup: New Organisation Discovery (v2)

Use this workflow to initialise a new vertical-specific workspace with AI Employees and strict multi-tenant security.

## Step 1: Discovery Phase (Clarifying Questions)
Ask the user the following 6 questions to calibrate the organisation:

1.  **Type of Organisation**: (e.g., Dental Clinic, Optician, Legal, Accounting, Logistics, or Retail)
    *   **Answer**: [ ]

2.  **Organisation Name & Mission**: Branding and primary objective.
    *   **Answer**: [ ]

3.  **Departmental Structure**: Which departments need AI staffing? (e.g., Front Desk, Operations, Billing)
    *   **Answer**: [ ]

4.  **Operational Model**: Should your AI employees be **Fully Agentic** or **Advisory**?
    *   **Answer**: [ ]

5.  **Security & Compliance**: Specific regional regulations (GDPR, POPIA, HIPAA) or high-security requirements?
    *   **Answer**: [ ]

6.  **CEO Sync**: Frequency of automated summaries delivered to your inbox.
    *   **Answer**: [ ]

## Step 2: Bible Lookup & Configuration
Once answers are received:
- Consult the corresponding JSON definition in `docs/Verticals/[Vertical].json`.
- Map answers to standard terminology, icons, and **Compliance Guards** defined in the Industry Bible.
- Provision the **Security Architecture** (Multi-tenant isolation, Encryption, Data Residency).

## Step 3: AI Employee Provisioning (Recruitment)
- Task **Jimi (HR)** to "hire" the specified AI employees.
- Provision dedicated **Departmental Inboxes** for each AI agent.

## Step 4: Verification
- Present the final workspace blueprint (UI, Security Roster, AI Team) for user approval.
