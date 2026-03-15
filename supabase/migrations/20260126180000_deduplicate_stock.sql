-- MIGRATION: Deduplicate Stock Tables and Add Constraints
-- Description: Removes duplicate stock entries caused by re-running migration scripts.
-- Applies unique constraints to reusable_stock and rental_stock to prevent recurrence.

BEGIN;

-- 1. Deduplicate Reusable Stock
-- Keep one record per item per location (arbitrarily the one with the "largest" UUID if no other sortable field)
DELETE FROM reusable_stock
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id, 
            ROW_NUMBER() OVER (
                PARTITION BY organization_id, item_id, location_id 
                ORDER BY id
            ) AS r_num
        FROM reusable_stock
    ) t
    WHERE t.r_num > 1
);

-- Add Unique Constraint to prevent future duplicates
ALTER TABLE reusable_stock 
ADD CONSTRAINT unique_reusable_item_location 
UNIQUE NULLS NOT DISTINCT (organization_id, item_id, location_id);


-- 2. Deduplicate Rental Stock
DELETE FROM rental_stock
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id, 
            ROW_NUMBER() OVER (
                PARTITION BY organization_id, rental_item_id, location_id 
                ORDER BY id
            ) AS r_num
        FROM rental_stock
    ) t
    WHERE t.r_num > 1
);

-- Add Unique Constraint
ALTER TABLE rental_stock 
ADD CONSTRAINT unique_rental_item_location 
UNIQUE NULLS NOT DISTINCT (organization_id, rental_item_id, location_id);


-- 3. Deduplicate Ingredient Batches (Exact duplicates only)
-- We check for exact matches on ingredient, quantity, cost, and received_at
DELETE FROM ingredient_stock_batches
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id, 
            ROW_NUMBER() OVER (
                PARTITION BY organization_id, ingredient_id, quantity, unit_cost_cents, received_at 
                ORDER BY id
            ) AS r_num
        FROM ingredient_stock_batches
    ) t
    WHERE t.r_num > 1
);

-- Note: We do NOT add a unique constraint here as legitimate identical batches might exist in future use cases.

COMMIT;
