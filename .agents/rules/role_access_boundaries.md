# Role Access Boundaries & Principle of Least Privilege

## Purpose
This document establishes immutable security boundaries across tenant roles in PXI-OS Core. Under no circumstances should operational or kitchen staff be granted administrative, executive, financial, or IT access.

---

## 1. Role Tiers & Scope

### Tier 1: C-Suite & System Administration
- **Roles**: `Super Admin`, `system_admin`, `Chief Executive Officer`, `Chairman`
- **Scope**: Complete administrative oversight, tenant provisioning, system settings, global diagnostics, and high-privilege configuration.
- **Allowed Modules**: All modules including `Super Admin`, `IT Console`, `Requisitions`, `API Diagnostics`.

### Tier 2: Management & Finance
- **Roles**: `Admin`, `Manager`, `Finance`, `Finance Officer`
- **Scope**: Departmental management, company finances, invoicing, ledger reconciliation, business intelligence.
- **Allowed Modules**: `Dashboard`, `CRM`, `Project Hub`, `Inventory`, `Orders & Invoicing`, `Finance`, `Human Resources`, `Automation`, `Analytics`, `Reports`, `Team Messages`, `Settings`.
- **Explicitly Forbidden**: `Super Admin` (unless explicitly flagged `is_super_admin`).

### Tier 3: Sales & Client Relations
- **Roles**: `Sales`, `Contact Center Supervisor`, `Contact Center Agent`
- **Scope**: Customer relationship management, lead generation, omni-channel customer support.
- **Allowed Modules**: `Dashboard`, `Prospecting`, `Service Hub`, `CRM & Client Management`, `Reports` (sales scope), `Team Messages`, `Settings`.
- **Explicitly Forbidden**: `Super Admin`, `IT Console`, `Strategic Hub`, `Finance`, `HR Management`, `Automation Admin`.

### Tier 4: Operational & Kitchen Staff (e.g. Sarah Okelezo, Olaitan, Obafunke, Mariam)
- **Roles**: `Kitchen Operations Supervisor`, `Kitchen Manager`, `Chef`, `Cook`, `Head Chef`, `Head Waiter`, `Stock Keeper`
- **Scope**: Daily kitchen, baking, and banquet event execution, inventory counts, food portion tracking, recipe execution, and operational reporting.
- **PERMITTED MODULES ONLY**:
  1. `Dashboard` (`/`)
  2. `Orders & Invoicing` / `Catering Ops` / `Bakery Ops` (`/catering`, `/bakery`)
  3. `Inventory` (`/inventory`)
  4. `Portion Monitor` (`/portion-monitor`)
  5. `CRM & Client Management` (`/crm` - operational guest/event details)
  6. `Reports` (`/reports` - operational food logs, wastage, and kitchen checklists)
  7. `Team Messages` (`/team`)
  8. `User Guides` (`/docs`)
  9. `Settings` (`/settings` - individual user preferences)
- **STRICTLY FORBIDDEN MODULES (PURGED FROM SIDEBAR & ROUTES)**:
  - ❌ `Super Admin` (`/super-admin`)
  - ❌ `IT Console` (`/admin/settings`)
  - ❌ `Analytics` (`/analytics`)
  - ❌ `Prospecting` (`/prospecting`)
  - ❌ `Strategic Hub` (`/executive-hub`)
  - ❌ `Service Hub` / Contact Center (`/contact-center`)
  - ❌ `Requisitions` (`/requisitions`)
  - ❌ `Automation` (`/automation`)
  - ❌ `Finance` (`/finance`)
  - ❌ `Human Resources` (`/hr`)
  - ❌ `Project Hub` (`/projects`)
  - ❌ `Procurement` (`/procurement`)
  - ❌ `Flight Ops`
  - ❌ `API Diagnostics`

---

## 2. Enforcement Mechanisms

1. **Precedence in `ProtectedRoute` (`src/App.tsx`)**:
   `allowedRoles` checks run BEFORE permission tag checks. Generic permissions such as `access:reports` must NEVER grant access to `allowedRoles`-restricted endpoints (e.g., `/analytics`).
2. **Precedence in `hasPermission` (`src/components/Layout.tsx`)**:
   Role exclusion is enforced immediately after C-suite executive bypass. If `allowedRoles` does not contain the active role, the function returns `false`.
3. **Hard Filter in `availableItems` and `visibleItems`**:
   Any items matching the `forbiddenForKitchen` list are unconditionally stripped from navigation items and customizer menus for kitchen roles.
4. **Auth Store Fallback (`src/store/useAuthStore.ts`)**:
   When role resolution is empty or fails, the user role defaults to `Role.EMPLOYEE`, NEVER `Role.ADMIN`.
