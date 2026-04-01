# Case Study: Supabase Auth NULL Fields Blocking Sign-In

## Executive Summary
Users were blocked from signing in because their Auth user records (`auth.users`) had unexpected `NULL` values in token and email-change fields that Supabase Auth expects to be strings.

## Symptoms
- Runtime failure during the Auth processing path.
- "Amina@everywoman.com" and other accounts unable to log in.

## Root Cause
In the `auth.users` table, at least one affected account had `NULL` in one or more of the following fields:
- `confirmation_token`
- `recovery_token`
- `email_change`
- `email_change_token_new`

Supabase Auth expects non-null string values for these fields during certain processing paths.

## Solution Applied
1.  Updated the affected user rows to normalize these fields from `NULL` to an empty string (`''`).
2.  Performed a global validation across `auth.users` to ensure zero `NULL`s remaining in those four fields.

## Preventive Recommendations
- **Migration Guard**: Add a migration to enforce `NOT NULL DEFAULT ''` on these fields.
- **Integrity Check**: Add a periodic integrity check or a database trigger to ensure these fields never drift back to `NULL`.
- **Manual Edit Caution**: Avoid manual edits to `auth.users`; if necessary, enforce non-null-safe updates.

---
*Recorded: 2026-03-31*
*Reference: user_report_20260331*
