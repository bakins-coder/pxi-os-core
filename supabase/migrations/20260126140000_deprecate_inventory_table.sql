-- MIGRATION: Deprecate Legacy Inventory Table
-- Description: Renames the old 'inventory' table to 'inventory_deprecated' to prevent confusion and accidental usage.
-- We do NOT drop it yet to preserve data for safety.

BEGIN;

-- 1. Rename the table
ALTER TABLE IF EXISTS inventory RENAME TO inventory_deprecated;

-- 2. Add a comment explaining why
COMMENT ON TABLE inventory_deprecated IS 'DEPRECATED: This table contains legacy mixed inventory data. Do not use. Use split tables (products, reusable_items, etc.) instead.';

-- 3. Revoke permissions to force failures if any code still tries to access it
REVOKE ALL ON inventory_deprecated FROM authenticated;
REVOKE ALL ON inventory_deprecated FROM anon;
-- Keep admin access just in case

COMMIT;
