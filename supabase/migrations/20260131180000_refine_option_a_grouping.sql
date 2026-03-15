-- Migration: Refine Recipe Groupings for Nigerian Menu - Option A
-- Updates grouping headers to match the requested "Product -" and "Protein -" format.

DO $$
DECLARE
    recipe_id_a UUID;
BEGIN
    SELECT id INTO recipe_id_a FROM recipes WHERE name = 'Nigerian Menu - Option A' LIMIT 1;
    
    IF recipe_id_a IS NOT NULL THEN
        -- 1. Categorize ingredients into specific requested groups
        UPDATE recipe_ingredients 
        SET sub_recipe_group = 
            CASE 
                WHEN ingredient_name IN ('RICE', 'Tomato puree', 'Whole Tomato', 'Whole Red Pepper', 'Ata Rodo', 'Groundnut Oil', 'Onions', 'Salt', 'Maggi') THEN 'Product - Jollof rice'
                WHEN ingredient_name IN ('Basmatti', 'Green Pepper', 'Spring Onion', 'L. Fillet', 'Prawn', 'C. Fillet', 'Soy Sauce', 'S. Chilli', 'Sesame', 'Oil', 'Onion', 'Carrot', 'Red Pepper', 'Sweet Corn') THEN 'Product - Chinese fried rice'
                WHEN ingredient_name IN ('Chicken', 'Elo') THEN 'Protein - Chicken in stew'
                WHEN ingredient_name IN ('Meat', 'Beef') THEN 'Protein - Fried Beef'
                WHEN ingredient_name IN ('Cabbage', 'Lettuce', 'Cocumber', 'Red Kidney', 'Salad cream', 'Mayonaise', 'Egg', 'Vineger') THEN 'Product - Catering Salad'
                WHEN ingredient_name IN ('Beans', 'Titus', 'Shombo', 'Rodo', 'Tatashe', 'Ewe') THEN 'Product - Moin Moin'
                ELSE 'General'
            END
        WHERE recipe_id = recipe_id_a;

        -- 2. Rename generic "Meat" to "Beef" for this specific recipe
        UPDATE recipe_ingredients 
        SET ingredient_name = 'Beef' 
        WHERE recipe_id = recipe_id_a AND ingredient_name = 'Meat';
        
        -- 3. Ensure "Elo" is correctly labeled if used as an ingredient for Chicken
        -- (Elo is usually part of the seasoning/base for the stew)
    END IF;
END $$;
