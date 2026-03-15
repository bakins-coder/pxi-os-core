# Database Migration Protocol (Safe & Self-Healing)

To ensure stability across different environments (Localhost, Vercel, Codespaces) and avoid "Column does not exist" errors during schema evolution, we adopt the following **Safe Migration Protocol**.

## Core Principle: "Assume Nothing, Verify Everything"

Migration scripts must never blindly assume a column or table exists (or doesn't exist). They must check the state before acting.

## 1. The "Self-Healing" Rename Block

When renaming columns or refactoring schema, **always** use a PL/pgSQL `DO $$` block to check if the old state exists.

**❌ Bad (Fragile):**
```sql
ALTER TABLE products RENAME COLUMN company_id TO organization_id;
-- Fails if run twice (column already renamed)
-- Fails if created fresh (column didn't exist)
```

**✅ Good (Robust):**
```sql
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'company_id') THEN
        ALTER TABLE products RENAME COLUMN company_id TO organization_id;
    END IF;
END $$;
```

## 2. Idempotent Policy Creation

Security policies (RLS) can often conflict if you try to create them when they already exist. Always DROP before CREATE.

**✅ Pattern:**
```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- 1. Drop potential old names/versions
DROP POLICY IF EXISTS "Old Policy Name" ON my_table;
DROP POLICY IF EXISTS "enable_access" ON my_table;

-- 2. Create fresh
CREATE POLICY "enable_access" ON my_table ...
```

## 3. Reference Correct Standard Columns

- **Organization ID**: Always use `organization_id` (Uniform across the system).
- **Primary Keys**: Always use `id uuid DEFAULT gen_random_uuid()` unless specific reason not to.
- **Timestamps**: Always include `created_at` and `updated_at`.

## 4. Verification Check

Before concluding a migration task, verify:
1.  Does it run on a **fresh** database (CI/CD)?
2.  Does it run on an **existing** database (User's Laptop)?
3.  Does it fix "half-migrated" states (e.g., column renamed but policy failed)?
