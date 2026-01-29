-- Migration: Create Recipes System for BOQ (Bill of Quantities)
-- This enables the BOQ feature to calculate ingredient costs and profit margins

-- 1. Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    base_portions INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create recipe_ingredients junction table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL,
    qty_per_portion NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    price_source_query TEXT,
    UNIQUE(recipe_id, ingredient_name)
);

-- 3. Add recipe_id column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS recipe_id UUID REFERENCES recipes(id);

-- 4. Enable RLS on new tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for recipes
CREATE POLICY "recipes_org_select" ON recipes FOR SELECT 
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "recipes_org_insert" ON recipes FOR INSERT 
    WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "recipes_org_update" ON recipes FOR UPDATE 
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "recipes_org_delete" ON recipes FOR DELETE 
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- 6. Create RLS policies for recipe_ingredients (join through recipes)
CREATE POLICY "recipe_ingredients_select" ON recipe_ingredients FOR SELECT 
    USING (recipe_id IN (SELECT id FROM recipes WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "recipe_ingredients_insert" ON recipe_ingredients FOR INSERT 
    WITH CHECK (recipe_id IN (SELECT id FROM recipes WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "recipe_ingredients_update" ON recipe_ingredients FOR UPDATE 
    USING (recipe_id IN (SELECT id FROM recipes WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "recipe_ingredients_delete" ON recipe_ingredients FOR DELETE 
    USING (recipe_id IN (SELECT id FROM recipes WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())));

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON recipes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON recipe_ingredients TO authenticated;

-- 8. Populate sample recipes for Xquisite Celebrations organization
-- Get the organization ID for Xquisite
DO $$
DECLARE
    org_id UUID := '10959119-72e4-4e57-ba54-923e36bba6a6';
    recipe_jollof UUID;
    recipe_fried_rice UUID;
    recipe_egusi UUID;
    recipe_pepper_soup UUID;
    recipe_suya UUID;
    recipe_puff_puff UUID;
    recipe_shrimp_cocktail UUID;
BEGIN
    -- Create Jollof Rice Recipe
    INSERT INTO recipes (id, organization_id, name, category, base_portions) 
    VALUES (gen_random_uuid(), org_id, 'Jollof Rice', 'Main Course', 100)
    RETURNING id INTO recipe_jollof;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query) VALUES
    (recipe_jollof, 'Long Grain Rice', 0.15, 'kg', 'wholesale rice price per kg Lagos Mile 12'),
    (recipe_jollof, 'Tomato Paste', 0.02, 'tin', 'tomato paste tin price Lagos wholesale'),
    (recipe_jollof, 'Fresh Tomatoes', 0.1, 'kg', 'fresh tomatoes price per kg Lagos market'),
    (recipe_jollof, 'Red Bell Pepper', 0.05, 'kg', 'red bell pepper price Lagos wholesale'),
    (recipe_jollof, 'Scotch Bonnet Pepper', 0.01, 'kg', 'scotch bonnet pepper price Lagos'),
    (recipe_jollof, 'Onions', 0.05, 'kg', 'onions price per kg Lagos Mile 12'),
    (recipe_jollof, 'Vegetable Oil', 0.03, 'litre', 'vegetable oil price per litre Lagos'),
    (recipe_jollof, 'Stock Cubes', 0.02, 'pack', 'maggi cubes price Lagos wholesale'),
    (recipe_jollof, 'Curry Powder', 0.005, 'kg', 'curry powder price Lagos');

    -- Create Fried Rice Recipe
    INSERT INTO recipes (id, organization_id, name, category, base_portions) 
    VALUES (gen_random_uuid(), org_id, 'Fried Rice', 'Main Course', 100)
    RETURNING id INTO recipe_fried_rice;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query) VALUES
    (recipe_fried_rice, 'Long Grain Rice', 0.15, 'kg', 'wholesale rice price per kg Lagos Mile 12'),
    (recipe_fried_rice, 'Mixed Vegetables', 0.08, 'kg', 'frozen mixed vegetables price Lagos'),
    (recipe_fried_rice, 'Liver', 0.03, 'kg', 'beef liver price per kg Lagos'),
    (recipe_fried_rice, 'Prawns', 0.02, 'kg', 'prawns price per kg Lagos fish market'),
    (recipe_fried_rice, 'Vegetable Oil', 0.02, 'litre', 'vegetable oil price per litre Lagos'),
    (recipe_fried_rice, 'Onions', 0.03, 'kg', 'onions price per kg Lagos Mile 12'),
    (recipe_fried_rice, 'Soy Sauce', 0.01, 'litre', 'soy sauce price Lagos wholesale'),
    (recipe_fried_rice, 'Stock Cubes', 0.02, 'pack', 'maggi cubes price Lagos wholesale');

    -- Create Egusi Soup Recipe
    INSERT INTO recipes (id, organization_id, name, category, base_portions) 
    VALUES (gen_random_uuid(), org_id, 'Egusi Soup', 'Soup', 100)
    RETURNING id INTO recipe_egusi;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query) VALUES
    (recipe_egusi, 'Egusi (Melon Seeds)', 0.05, 'kg', 'egusi melon seeds price per kg Lagos Mile 12'),
    (recipe_egusi, 'Palm Oil', 0.03, 'litre', 'palm oil price per litre Lagos'),
    (recipe_egusi, 'Spinach', 0.08, 'kg', 'spinach ugwu price per kg Lagos'),
    (recipe_egusi, 'Stockfish', 0.02, 'kg', 'stockfish price per kg Lagos'),
    (recipe_egusi, 'Dry Fish', 0.02, 'kg', 'dry fish price per kg Lagos'),
    (recipe_egusi, 'Beef', 0.05, 'kg', 'beef price per kg Lagos'),
    (recipe_egusi, 'Crayfish', 0.01, 'kg', 'crayfish price per kg Lagos Mile 12'),
    (recipe_egusi, 'Onions', 0.02, 'kg', 'onions price per kg Lagos Mile 12'),
    (recipe_egusi, 'Locust Beans', 0.005, 'kg', 'locust beans dawadawa price Lagos');

    -- Create Pepper Soup Recipe
    INSERT INTO recipes (id, organization_id, name, category, base_portions) 
    VALUES (gen_random_uuid(), org_id, 'Pepper Soup', 'Soup', 100)
    RETURNING id INTO recipe_pepper_soup;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query) VALUES
    (recipe_pepper_soup, 'Goat Meat', 0.08, 'kg', 'goat meat price per kg Lagos'),
    (recipe_pepper_soup, 'Pepper Soup Spice', 0.01, 'kg', 'pepper soup spice price Lagos'),
    (recipe_pepper_soup, 'Onions', 0.02, 'kg', 'onions price per kg Lagos Mile 12'),
    (recipe_pepper_soup, 'Scotch Bonnet Pepper', 0.01, 'kg', 'scotch bonnet pepper price Lagos'),
    (recipe_pepper_soup, 'Stock Cubes', 0.01, 'pack', 'maggi cubes price Lagos wholesale'),
    (recipe_pepper_soup, 'Scent Leaves', 0.02, 'kg', 'scent leaves nchanwu price Lagos');

    -- Create Suya Recipe
    INSERT INTO recipes (id, organization_id, name, category, base_portions) 
    VALUES (gen_random_uuid(), org_id, 'Suya', 'Appetizer', 100)
    RETURNING id INTO recipe_suya;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query) VALUES
    (recipe_suya, 'Beef Sirloin', 0.1, 'kg', 'beef sirloin price per kg Lagos'),
    (recipe_suya, 'Suya Spice (Yaji)', 0.02, 'kg', 'suya spice yaji price lagos'),
    (recipe_suya, 'Vegetable Oil', 0.01, 'litre', 'vegetable oil price per litre Lagos'),
    (recipe_suya, 'Onions', 0.02, 'kg', 'onions price per kg Lagos Mile 12');

    -- Create Puff Puff Recipe
    INSERT INTO recipes (id, organization_id, name, category, base_portions) 
    VALUES (gen_random_uuid(), org_id, 'Puff Puff', 'Dessert', 100)
    RETURNING id INTO recipe_puff_puff;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query) VALUES
    (recipe_puff_puff, 'All-Purpose Flour', 0.05, 'kg', 'flour price per kg Lagos wholesale'),
    (recipe_puff_puff, 'Sugar', 0.02, 'kg', 'sugar price per kg Lagos'),
    (recipe_puff_puff, 'Yeast', 0.002, 'kg', 'yeast price Lagos wholesale'),
    (recipe_puff_puff, 'Vegetable Oil', 0.03, 'litre', 'vegetable oil price per litre Lagos'),
    (recipe_puff_puff, 'Nutmeg', 0.001, 'kg', 'nutmeg price Lagos');

    -- Create Shrimp Cocktail Recipe
    INSERT INTO recipes (id, organization_id, name, category, base_portions) 
    VALUES (gen_random_uuid(), org_id, 'Shrimp Cocktail', 'Appetizer', 100)
    RETURNING id INTO recipe_shrimp_cocktail;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query) VALUES
    (recipe_shrimp_cocktail, 'Large Prawns', 0.08, 'kg', 'large prawns price per kg Lagos fish market'),
    (recipe_shrimp_cocktail, 'Mayonnaise', 0.02, 'litre', 'mayonnaise price Lagos wholesale'),
    (recipe_shrimp_cocktail, 'Tomato Ketchup', 0.01, 'litre', 'tomato ketchup price Lagos'),
    (recipe_shrimp_cocktail, 'Lemon', 0.02, 'kg', 'lemon price Lagos'),
    (recipe_shrimp_cocktail, 'Lettuce', 0.02, 'kg', 'lettuce price per kg Lagos');

    -- Link recipes to products (using ILIKE for flexible matching)
    UPDATE products SET recipe_id = recipe_jollof WHERE LOWER(name) LIKE '%jollof%' AND organization_id = org_id;
    UPDATE products SET recipe_id = recipe_fried_rice WHERE LOWER(name) LIKE '%fried rice%' AND organization_id = org_id;
    UPDATE products SET recipe_id = recipe_egusi WHERE LOWER(name) LIKE '%egusi%' AND organization_id = org_id;
    UPDATE products SET recipe_id = recipe_pepper_soup WHERE LOWER(name) LIKE '%pepper soup%' AND organization_id = org_id;
    UPDATE products SET recipe_id = recipe_suya WHERE LOWER(name) LIKE '%suya%' AND organization_id = org_id;
    UPDATE products SET recipe_id = recipe_puff_puff WHERE LOWER(name) LIKE '%puff%' AND organization_id = org_id;
    UPDATE products SET recipe_id = recipe_shrimp_cocktail WHERE LOWER(name) LIKE '%shrimp%' AND organization_id = org_id;

    RAISE NOTICE 'Created % recipes and linked to products', 7;
END $$;

-- Note: The recipe_ingredients table contains ingredient info for BOQ calculations
-- The existing ingredients table has a different schema, so we skip populating it from recipes
