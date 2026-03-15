-- Migration: Sanitize Recipe Data (Idempotent)
-- 1. Add sub_recipe_group column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipe_ingredients' AND column_name='sub_recipe_group') THEN
        ALTER TABLE recipe_ingredients ADD COLUMN sub_recipe_group TEXT;
    END IF;
END $$;

-- 2. Define standard groupings for Option A
DO $$
DECLARE
    recipe_id_a UUID;
BEGIN
    SELECT id INTO recipe_id_a FROM recipes WHERE name = 'Nigerian Menu - Option A' LIMIT 1;
    
    IF recipe_id_a IS NOT NULL THEN
        UPDATE recipe_ingredients 
        SET sub_recipe_group = 
            CASE 
                WHEN ingredient_name IN ('RICE', 'Tomato puree', 'Whole Tomato', 'Whole Red Pepper', 'Ata Rodo', 'Groundnut Oil', 'Onions', 'Salt', 'Maggi') THEN 'Jollof Rice (Component)'
                WHEN ingredient_name IN ('Basmatti', 'Green Pepper', 'Spring Onion', 'L. Fillet', 'Prawn', 'C. Fillet', 'Soy Sauce', 'S. Chilli', 'Sesame', 'Oil', 'Onion', 'Carrot', 'Red Pepper', 'Sweet Corn') THEN 'Special Fried Rice (Component)'
                WHEN ingredient_name IN ('Chicken', 'Meat', 'Elo', 'Ewe', 'Titus', 'Shombo', 'Rodo', 'Tatashe', 'Beans') THEN 'Proteins & Extras'
                WHEN ingredient_name IN ('Cabbage', 'Lettuce', 'Cocumber', 'Red Kidney', 'Salad cream', 'Mayonaise', 'Egg', 'Vineger') THEN 'Catering Salad'
                WHEN ingredient_name = 'Beef' THEN 'Proteins & Extras'
                ELSE 'General'
            END
        WHERE recipe_id = recipe_id_a;

        -- Rename "Meat" to "Beef" in Option A for clarity
        UPDATE recipe_ingredients 
        SET ingredient_name = 'Beef' 
        WHERE recipe_id = recipe_id_a AND ingredient_name = 'Meat';
    END IF;
END $$;

-- 3. Correct Shrimp Cocktail (Remove incorrect Okro linkage)
DO $$
DECLARE
    org_id UUID := '10959119-72e4-4e57-ba54-923e36bba6a6';
    recipe_shrimp UUID;
    v_recipe_exists UUID;
BEGIN
    -- Check for existing Shrimp Cocktail recipe
    SELECT id INTO v_recipe_exists FROM recipes WHERE name = 'Shrimp Cocktail' AND organization_id = org_id LIMIT 1;

    IF v_recipe_exists IS NOT NULL THEN
        -- Check if it has incorrect ingredients (like Okro)
        IF EXISTS (SELECT 1 FROM recipe_ingredients WHERE recipe_id = v_recipe_exists AND ingredient_name = 'Okro') THEN
            DELETE FROM recipe_ingredients WHERE recipe_id = v_recipe_exists;
            DELETE FROM recipes WHERE id = v_recipe_exists;
            v_recipe_exists := NULL;
        END IF;
    END IF;

    IF v_recipe_exists IS NULL THEN
        INSERT INTO recipes (id, organization_id, name, category, base_portions)
        VALUES (gen_random_uuid(), org_id, 'Shrimp Cocktail', 'Appetizer', 100)
        RETURNING id INTO recipe_shrimp;

        INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query) VALUES
        (recipe_shrimp, 'Large Prawns', 0.08, 'kg', 'large prawns price per kg Lagos wholesale'),
        (recipe_shrimp, 'Mayonnaise', 0.02, 'litre', 'mayonnaise price Lagos wholesale'),
        (recipe_shrimp, 'Tomato Ketchup', 0.01, 'litre', 'tomato ketchup price Lagos'),
        (recipe_shrimp, 'Lemon', 0.02, 'kg', 'lemon price Lagos'),
        (recipe_shrimp, 'Lettuce', 0.02, 'kg', 'lettuce price per kg Lagos');
        
        v_recipe_exists := recipe_shrimp;
    END IF;

    -- Link product to correct recipe
    UPDATE products SET recipe_id = v_recipe_exists 
    WHERE (LOWER(name) LIKE '%shrimp%' AND LOWER(name) LIKE '%cocktail%') 
    AND organization_id = org_id;
END $$;
