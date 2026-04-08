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

## 7. Tax Compliance & Financial Accuracy
### Item-Based Tax Exclusion Logic
In specialized industries (like Banquets/Catering), certain fees (e.g., transportation, menu charges) are often non-taxable, while others (food/beverage) attract SC and VAT.
*   **Pattern**: Maintain a bifurcated subtotal system (`taxableSubtotalCents` vs `nonTaxableSubtotalCents`). Tax functions must only operate on the taxable base, while the grand total aggregates the final values.
*   **Learning**: Corrected the "double taxation" bug where VAT was being applied to non-food items, ensuring legal compliance for Xquisite invoices.

## 8. UI Resilience & Layout Hardening
### Auto-Wrapping over Line Truncation
In data-rich operational hubs, long descriptions (e.g., Nigerian Menu choices) are frequently truncated by default CSS layouts, causing information loss.
*   **Pattern**: Avoid `truncate` and fixed-height headers for descriptive fields. Use auto-expanding `textarea` for inputs and `whitespace-normal break-words` for display text.
*   **Learning**: The "truncated Nigerian menu" issue was solved by removing CSS truncation and enforcing container grounding with `min-w-0` on flex/grid items to prevent layout leaks.

## 9. Terminology & Role Standardization
### Professional Operational Nomenclature
Technical labels (e.g., "Lead Designer") often mismatch the actual industry roles (e.g., "Lead Co-ordinator"), leading to confusion in multi-tenant environments.
*   **Pattern**: Centralize operational labels in the `IndustryProfile`. Components must use these profile-level terms rather than hardcoded UI strings.
*   **Learning**: Updated role terminology across the Fulfillment Hub and Order Brochure to better reflect the administrative reality of Xquisite operations.

## 10. Premium Dashboard Interaction
### Modals over Context-Switching (Navigation)
On high-fidelity executive dashboards, navigating to a new route for a simple detail check (e.g., a calendar event) can feel like the "page disappearing," breaking the mental model of the dashboard.
*   **Pattern**: Use rich detail modals (`EventDetailCard`) for first-click interactions. Only use full-page navigation for explicit "Full History" or "Deep Management" workflows.
*   **Learning**: Fixed the "disappearing page" calendar bug by ensuring clicks render a modal instead of triggering a route change, preserving the dashboard's operational context.
