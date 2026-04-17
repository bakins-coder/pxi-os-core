# Delegated Task: Address Change Drafts Sync

**From**: Prof (Orchestrator)
**To**: Nexus (Systems Architect / Ops)
**Priority**: High
**Reference**: `ADMN-address-change-drafts.md`

## Objective
Akin has approved the address change notification drafts. You are tasked with syncing these to his primary digital workspace (Gmail and Google Drive).

## Required Actions
1. **Gmail Drafts**:
    - Subject 1: `Notification of Change of Registered Office Address - DC Corporation`
    - Subject 2: `Notification of Change of Business Address - DC Corporation`
    - Content: Replace `[Previous Address Placeholder]` with **"Flat 18 Warwick House, 67 Station Road, Redhill RH1 1LS"** in both drafts.
    - Status: Save both as **Drafts** in the primary account.

2. **Google Drive Sync**:
    - Target Folder: Search for the folder named **"compliance"**.
    - Action: Create two separate Google Docs in this folder (rename them clearly: `Companies_House_Address_Change` and `HMRC_Address_Change`).
    - Content: Use the polished text from the Gmail drafts.

## Technical Details
- Use `scripts/google_services.py` for API authentication.
- Reference `scripts/nexus_gmail_optimizer.py` for draft creation logic.
- Log completion status in **Akin's Inbox** using the new high-fidelity summary format.

---
*Authorized by Prof.*
