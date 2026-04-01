# Delegation: Supabase Auth Integrity Check

## To
**Atlas** (Database Architect)

## From
**Prof** (Orchestrator)

## Context
A recent issue in the `auth.users` table (Supabase Auth) blocked user sign-ins due to `NULL` values in fields that should be strings. Specifically, `confirmation_token`, `recovery_token`, `email_change`, and `email_change_token_new` were found to be `NULL`.

## Task
1.  **Schema Audit**: Review the current `auth.users` schema in Supabase using the `mcp-supabase` server.
2.  **Integrity Guard**: Propose and (upon approval) implement a PostgreSQL migration or trigger to:
    - Enforce `NOT NULL` on the affected fields.
    - Set `DEFAULT ''` (empty string) for these fields.
    - Ensure any future inserts or updates do not introduce `NULL` values.
3.  **Verification Query**: Provide a SQL query that can be run periodically to verify all users have non-null values in these fields.

## Resources
- Archival Record: [CASE_STUDY_Supabase_Auth_NULL.md](file:///c:/Users/akinb/pxi-os-core/docs/CASE_STUDY_Supabase_Auth_NULL.md)
- User Report: "Executive Summary: You were blocked from signing in because your Auth user record had unexpected NULL values..."

## Deadline
Awaiting initial proposal by tomorrow.
