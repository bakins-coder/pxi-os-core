# Architectural Learnings: Best-in-Class Multi-Tenant Platform

This document consolidates key technical and design patterns discovered during the restoration and refactor of the **Xquisite Celebrations** (Catering & Bakery) and **Kleen Dental** (Dental Clinic) workspaces. These principles are foundational for a scalable, white-labelable Business Operating System.

## 1. Permission Hygiene & Role Standardization
### Case-Insensitivity is Non-Negotiable
Databases and auth providers often return role strings in varying cases (e.g., `ADMIN`, `admin`, `system_admin`). Hardcoded lowercase checks in the UI are a common failure point.
*   **Pattern**: Use `.toUpperCase()` or case-neutral enums for all role-based visibility logic.
*   **Learning**: A "missing tab" is often just a case-sensitivity mismatch in `src/types.ts` vs the database.

### System-Level "God Mode"
Vertical-specific configuration (Industry Profiles) can accidentally lock out platform administrators if the logic is too strict.
*   **Pattern**: Implement an administrative bypass (`hasPermission`) that prioritizes the user's role (e.g., `SYSTEM_ADMIN`) over the workspace's industry settings.
*   **Learning**: System admins must remain vertical-agnostic to maintain operational control.

## 2. Multi-Vertical Context Propagation
### Beyond the Global Workspace Type
In complex workspaces with multiple verticals (e.g., Catering which also does Bakery), relying solely on a global `settings.type` leads to terminology leakage.
*   **Pattern**: Modals and sub-components must accept an explicit `vertical` prop. If absent, they should fallback to the primary workspace type, but they must support override.
*   **Learning**: The "Bespoke Culinary Request" appearing in a Cake Order modal was fixed by passing the explicit vertical context to the `OrderBrochure` component.

## 3. Data Hydration & Mapping
### Property Mapping Integrity
Multi-tenant platforms often fetch data from views or tables with varying schema styles (`snake_case` vs `camelCase`). 
*   **Pattern**: Centralize all data ingestion through mapping functions (e.g., `mapIncomingRow`). Every fetch tool (Supabase, API, etc.) must pass through this hygiene layer.
*   **Learning**: Broken inventory images (the "Tofu Salad" issue) were resolved by ensuring that `image_url` from the database correctly hydrates the `image` property in the frontend model.

## 4. White-Label Privacy & Security
### Unauthenticated Branding Protected
Leaking a tenant's brand name (e.g., showing "Xquisite OS") on the login page before a session is started is a privacy risk and breaks the white-label experience for a platform provider.
*   **Pattern**: The login screen should always reflect the **Platform Identity** (`Paradigm-Xi`). Brand-specific overrides should only inject *after* successful authentication or explicit subdomain identification.
*   **Learning**: Replaced dynamic `settings.name` in the Auth components with hardcoded Platform constants to ensure a secure, generic entry point.

## 5. Backward Compatibility & Null Fallbacks
### Legacy Record Resiliency
Adding a new discriminator field (like `vertical`) to existing tables will result in `null` values for all historic records.
*   **Pattern**: Filtering logic must treat `null` or `undefined` as belonging to the "Primary Vertical" to ensure zero loss of visibility for legacy orders.
*   **Learning**: When Bakery Ops was introduced, Catering orders initially leaked because they weren't explicitly tagged. Updating the filter to treat "untagged" as "Catering" fixed the isolation.

## 6. Real-Time Operational Hydration
### Reactive UI State
Operational dashboards (like the Fulfillment Hub) must be reactive to route changes and vertical state to avoid stale data rendering when switching departments.
*   **Pattern**: Use `useMemo` hooks with comprehensive dependency arrays that include the `vertical` prop.
*   **Learning**: Missing `vertical` in the `useMemo` dependency array prevented the dashboard from refreshing when switching between Catering and Bakery routes.
