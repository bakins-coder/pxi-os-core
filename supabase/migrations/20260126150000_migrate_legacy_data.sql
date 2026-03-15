-- MIGRATION: Migrate Data from Legacy Inventory to Split Tables
-- Description: Reads data from 'inventory_deprecated' and inserts/updates split tables.
-- Handles: Categories, Units, Products, Ingredients, Reusable Items, Rental Items, and Stock.

BEGIN;

-- 0. Helper function to clean text matching
-- 0. Helper function removed (inlined logic below)

-- 1. Ensure a default Unit of Measure exists for each organization found in legacy data
-- We need this because new tables require a unit_id, but legacy didn't have it.
INSERT INTO units_of_measure (id, organization_id, key, name)
SELECT DISTINCT
    gen_random_uuid(),
    company_id,
    'each',
    'Each'
FROM inventory_deprecated
WHERE company_id IS NOT NULL
ON CONFLICT (organization_id, key) DO NOTHING;

-- 2. Migrate Categories
-- Legacy 'category' column was just text. New schema uses 'categories' table.
-- We'll try to map legacy types to 'category_type' enums: 'menu', 'inventory', 'asset'.
WITH unique_categories AS (
    SELECT DISTINCT 
        company_id, 
        TRIM(BOTH FROM category) as cat_name,
        CASE 
            WHEN type = 'product' THEN 'menu'::category_type
            WHEN type IN ('ingredient', 'raw_material') THEN 'ingredient'::category_type
            ELSE 'asset'::category_type -- asset, reusable, rental
        END as derived_type
    FROM inventory_deprecated
    WHERE category IS NOT NULL
)
INSERT INTO categories (id, organization_id, name, category_type)
SELECT 
    gen_random_uuid(),
    company_id,
    cat_name,
    derived_type
FROM unique_categories uc
WHERE NOT EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.organization_id = uc.company_id 
    AND c.name = uc.cat_name
);

-- 3. Migrate Products (Menu Items)
-- Source: type = 'product'
INSERT INTO products (
    id, 
    organization_id, 
    name, 
    description, 
    price_cents, 
    image_url, 
    category_id, 
    is_active, 
    created_at
)
SELECT 
    inv.id,
    inv.company_id,
    inv.name,
    inv.description,
    COALESCE(inv.price_cents, 0),
    inv.image,
    cat.id as category_id,
    true as is_active,
    COALESCE(inv.created_at, now())
FROM inventory_deprecated inv
LEFT JOIN categories cat 
    ON cat.organization_id = inv.company_id 
    AND cat.name = TRIM(BOTH FROM inv.category)
WHERE inv.type = 'product'
AND NOT EXISTS (
    SELECT 1 FROM products p 
    WHERE p.organization_id = inv.company_id 
    AND (p.name = inv.name OR p.normalized_name = TRIM(BOTH FROM inv.name))
)
ON CONFLICT (id) DO UPDATE SET
    price_cents = EXCLUDED.price_cents,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id;

-- 4. Migrate Ingredients & Stock
-- Source: type IN ('ingredient', 'raw_material')
-- 4a. Insert items
INSERT INTO ingredients (
    id, 
    organization_id, 
    name, 
    category_id, 
    unit_id, 
    image_url
)
SELECT 
    inv.id,
    inv.company_id,
    inv.name,
    cat.id,
    (SELECT id FROM units_of_measure uom WHERE uom.organization_id = inv.company_id AND uom.key = 'each' LIMIT 1),
    inv.image
FROM inventory_deprecated inv
LEFT JOIN categories cat 
    ON cat.organization_id = inv.company_id 
    AND cat.name = TRIM(BOTH FROM inv.category)
WHERE inv.type IN ('ingredient', 'raw_material')
AND NOT EXISTS (
    SELECT 1 FROM ingredients i
    WHERE i.organization_id = inv.company_id 
    AND i.name = inv.name
)
ON CONFLICT (id) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id;

-- 4b. Insert stock batches (Migration Logic: One initial batch per item)
INSERT INTO ingredient_stock_batches (
    id,
    organization_id,
    ingredient_id,
    quantity,
    unit_id,
    unit_cost_cents,
    received_at,
    status
)
SELECT 
    gen_random_uuid(), -- New ID for the batch
    inv.company_id,
    i.id, -- Use valid ingredient_id from existing table
    COALESCE(inv.stock_quantity, 0),
    (SELECT id FROM units_of_measure uom WHERE uom.organization_id = inv.company_id AND uom.key = 'each' LIMIT 1),
    COALESCE(inv.price_cents, 0), -- usage of price as cost for ingredients
    COALESCE(inv.created_at, now()),
    'available'
FROM inventory_deprecated inv
JOIN ingredients i ON i.organization_id = inv.company_id AND (i.name = inv.name OR i.id = inv.id)
WHERE inv.type IN ('ingredient', 'raw_material')
AND inv.stock_quantity > 0;


-- 5. Migrate Reusable Items (Owned Assets)
-- Source: (type IN ('asset', 'reusable')) AND (is_rental IS FALSE/NULL)
-- 5a. Insert Items
INSERT INTO reusable_items (
    id,
    organization_id,
    name,
    category_id,
    unit_id,
    image_url
)
SELECT 
    inv.id,
    inv.company_id,
    inv.name,
    cat.id,
    (SELECT id FROM units_of_measure uom WHERE uom.organization_id = inv.company_id AND uom.key = 'each' LIMIT 1),
    inv.image
FROM inventory_deprecated inv
LEFT JOIN categories cat 
    ON cat.organization_id = inv.company_id 
    AND cat.name = TRIM(BOTH FROM inv.category)
WHERE inv.type IN ('asset', 'reusable')
AND (inv.is_rental IS NULL OR inv.is_rental = false)
AND NOT EXISTS (
    SELECT 1 FROM reusable_items r
    WHERE r.organization_id = inv.company_id 
    AND r.name = inv.name
)
ON CONFLICT (id) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id;

-- 5b. Insert Stock
INSERT INTO reusable_stock (
    id,
    organization_id,
    item_id,
    quantity_on_hand,
    location_id
)
SELECT 
    gen_random_uuid(),
    inv.company_id,
    ri.id, -- Use valid item_id
    COALESCE(inv.stock_quantity, 0),
    NULL -- No location info in legacy
FROM inventory_deprecated inv
JOIN reusable_items ri ON ri.organization_id = inv.company_id AND (ri.name = inv.name OR ri.id = inv.id)
WHERE inv.type IN ('asset', 'reusable')
AND (inv.is_rental IS NULL OR inv.is_rental = false)
AND inv.stock_quantity > 0;

-- 6. Migrate Rental Items (3rd Party)
-- Source: type = 'rental' OR is_rental = TRUE
-- 6a. Insert Items
INSERT INTO rental_items (
    id,
    organization_id,
    name,
    category_id,
    unit_id,
    replacement_cost_cents,
    image_url
)
SELECT 
    inv.id,
    inv.company_id,
    inv.name,
    cat.id,
    (SELECT id FROM units_of_measure uom WHERE uom.organization_id = inv.company_id AND uom.key = 'each' LIMIT 1),
    COALESCE(inv.price_cents, 0), -- price represents replacement cost for rentals likely
    inv.image
FROM inventory_deprecated inv
LEFT JOIN categories cat 
    ON cat.organization_id = inv.company_id 
    AND cat.name = TRIM(BOTH FROM inv.category)
WHERE inv.type = 'rental' OR inv.is_rental = true
AND NOT EXISTS (
    SELECT 1 FROM rental_items r
    WHERE r.organization_id = inv.company_id 
    AND r.name = inv.name
)
ON CONFLICT (id) DO UPDATE SET
    replacement_cost_cents = EXCLUDED.replacement_cost_cents,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id;

-- 6b. Insert Stock
INSERT INTO rental_stock (
    id,
    organization_id,
    rental_item_id,
    quantity_on_hand,
    location_id
)
SELECT 
    gen_random_uuid(),
    inv.company_id,
    ri.id, -- Use valid rental_item_id
    COALESCE(inv.stock_quantity, 0),
    NULL
FROM inventory_deprecated inv
JOIN rental_items ri ON ri.organization_id = inv.company_id AND (ri.name = inv.name OR ri.id = inv.id)
WHERE (inv.type = 'rental' OR inv.is_rental = true)
AND inv.stock_quantity > 0;

COMMIT;
