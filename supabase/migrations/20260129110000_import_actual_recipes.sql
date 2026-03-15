-- Migration: Import actual recipes with scaling tiers
-- This uses JSONB to preserve MD's granular scaling measurements

UPDATE products SET recipe_id = NULL WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6');
DELETE FROM recipes WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';

DO $$
DECLARE
    org_id UUID := '10959119-72e4-4e57-ba54-923e36bba6a6';
    recipe_0 UUID;
    recipe_1 UUID;
    recipe_2 UUID;
    recipe_3 UUID;
    recipe_4 UUID;
    recipe_5 UUID;
    recipe_6 UUID;
    recipe_7 UUID;
    recipe_8 UUID;
    recipe_9 UUID;
    recipe_10 UUID;
    recipe_11 UUID;
    recipe_12 UUID;
    recipe_13 UUID;
    recipe_14 UUID;
    recipe_15 UUID;
    recipe_16 UUID;
    recipe_17 UUID;
    recipe_18 UUID;
    recipe_19 UUID;
    recipe_20 UUID;
    recipe_21 UUID;
    recipe_22 UUID;
    recipe_23 UUID;
    recipe_24 UUID;
    recipe_25 UUID;
    recipe_26 UUID;
BEGIN

    -- Jollof Rice
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Jollof Rice', 'Main Course', 100)
    RETURNING id INTO recipe_0;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_0, 'RICE', 0.06, 'kg', 'RICE price per kg Lagos wholesale', '{"35":2,"50":3,"100":6,"150":9,"200":12,"250":15,"300":18,"350":20,"400":23,"450":26,"500":29,"17.5":1}'::jsonb),
    (recipe_0, 'Tomato puree', 0.018, 'litre', 'Tomato puree price per litre Lagos wholesale', '{"35":0.6,"50":0.9,"100":1.8,"150":2.6,"200":3.5,"250":4.3,"300":5.2,"350":6,"400":6.9,"450":7.8,"500":8.6,"17.5":0.3}'::jsonb),
    (recipe_0, 'Whole Tomato', 0.023, 'kg', 'Whole Tomato price per kg Lagos wholesale', '{"35":0.8,"50":1.2,"100":2.3,"150":3.5,"200":4.6,"250":5.8,"300":6.9,"350":8,"400":9.2,"450":10.3,"500":11.5,"17.5":0.4}'::jsonb),
    (recipe_0, 'Whole Red Pepper', 0.0043, 'kg', 'Whole Red Pepper price per kg Lagos wholesale', '{"35":0.15,"50":0.22,"100":0.43,"150":0.65,"200":0.86,"250":1.08,"300":1.29,"350":1.5,"400":1.72,"450":1.93,"500":2.15,"17.5":0.075}'::jsonb),
    (recipe_0, 'Ata Rodo', 0.006, 'kg', 'Ata Rodo price per kg Lagos wholesale', '{"35":0.2,"50":0.3,"100":0.6,"150":0.9,"200":1.2,"250":1.5,"300":1.8,"350":2,"400":2.3,"450":2.6,"500":2.9,"17.5":0.1}'::jsonb),
    (recipe_0, 'Groundnut Oil', 0.012, 'litre', 'Groundnut Oil price per litre Lagos wholesale', '{"35":0.4,"50":0.6,"100":1.2,"150":1.8,"200":2.3,"250":2.9,"300":3.5,"350":4,"400":4.6,"450":5.2,"500":5.8,"17.5":0.2}'::jsonb),
    (recipe_0, 'Onions', 0.015, 'kg', 'Onions price per kg Lagos wholesale', '{"35":0.5,"50":0.8,"100":1.5,"150":2.2,"200":2.9,"250":3.6,"300":4.3,"350":5,"400":5.8,"450":6.5,"500":7.2,"17.5":0.25}'::jsonb),
    (recipe_0, 'Salt', 0.001, 'kg', 'Salt price per kg Lagos wholesale', '{"35":0.1,"50":0.1,"100":0.1,"150":0.2,"200":0.2,"250":0.3,"300":0.3,"350":0.4,"400":0.4,"450":0.5,"500":0.5,"17.5":0.017}'::jsonb),
    (recipe_0, 'Maggi', 0.002, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"35":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.4,"300":0.5,"350":0.6,"400":0.7,"450":0.8,"500":0.8,"17.5":0.028}'::jsonb);

    -- Prawn & Calamari
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Prawn & Calamari', 'Appetizer', 100)
    RETURNING id INTO recipe_1;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_1, 'Prawn', 0.03, 'kg', 'Prawn price per kg Lagos wholesale', '{"10":0.25,"20":1,"50":2,"100":3,"150":4,"200":5,"250":7,"300":8,"350":9,"400":10,"450":12,"500":13}'::jsonb),
    (recipe_1, 'Calamari', 0.05, 'kg', 'Calamari price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_1, 'Egg', 0.5, 'pcs', 'Egg price per pcs Lagos wholesale', '{"10":5,"20":10,"50":25,"100":50,"150":75,"200":100,"250":125,"300":150,"350":175,"400":200,"450":225,"500":250}'::jsonb),
    (recipe_1, 'Ice Berg', 0.05, 'kg', 'Ice Berg price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_1, 'Cocumber', 0.03, 'kg', 'Cocumber price per kg Lagos wholesale', '{"10":0.3,"20":0.6,"50":1.5,"100":3,"150":4.5,"200":6,"250":7.5,"300":9,"350":10.5,"400":12,"450":13.5,"500":15}'::jsonb),
    (recipe_1, 'Coloured Pepper', 0.01, 'kg', 'Coloured Pepper price per kg Lagos wholesale', '{"10":0.1,"20":0.2,"50":0.5,"100":1,"150":1.5,"200":2,"250":2.5,"300":3,"350":3.5,"400":4,"450":4.5,"500":5}'::jsonb),
    (recipe_1, 'Cherry', 0.025, 'kg', 'Cherry price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_1, 'Salad Cream', 0.014, 'kg', 'Salad Cream price per kg Lagos wholesale', '{"10":0.14,"20":0.3,"50":0.7,"100":1.4,"150":2.1,"200":2.8,"250":3.5,"300":4.2,"350":4.9,"400":5.6,"450":6.3,"500":7}'::jsonb),
    (recipe_1, 'Mayonaise', 0.01, 'kg', 'Mayonaise price per kg Lagos wholesale', '{"10":0.1,"20":0.2,"50":0.5,"100":1,"150":1.5,"200":2,"250":2.5,"300":3,"350":3.5,"400":4,"450":4.5,"500":5}'::jsonb);

    -- Sweet & Sour Chicken
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Sweet & Sour Chicken', 'Main Course', 100)
    RETURNING id INTO recipe_2;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_2, 'Chicken', 0.15, 'kg', 'Chicken price per kg Lagos wholesale', '{"10":1.44,"20":3,"50":8,"100":15,"150":22,"200":29,"250":36,"300":44,"350":51,"400":58,"450":65,"500":72}'::jsonb),
    (recipe_2, 'Pineapple', 0.025, 'kg', 'Pineapple price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_2, 'Ketchup', 0.05, 'kg', 'Ketchup price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_2, 'Vinegar', 0.025, 'kg', 'Vinegar price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.25,"100":2.5,"150":3.75,"200":5,"250":6.25,"300":7.5,"350":8.75,"400":10,"450":11.25,"500":12.5}'::jsonb),
    (recipe_2, 'Oil', 0.02, 'litre', 'Oil price per litre Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_2, 'Sweet Chilli', 0.025, 'kg', 'Sweet Chilli price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_2, 'Onion', 0.05, 'kg', 'Onion price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_2, 'Green Pepper', 0.02, 'kg', 'Green Pepper price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_2, 'Red Pepper', 0.015, 'kg', 'Red Pepper price per kg Lagos wholesale', '{"10":0.15,"20":0.3,"50":0.8,"100":1.5,"150":2.3,"200":3,"250":3.8,"300":4.5,"350":5.3,"400":6,"450":6.8,"500":7.5}'::jsonb),
    (recipe_2, 'Maggi', 0.004, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"10":0.032,"20":0.1,"50":0.2,"100":0.4,"150":0.5,"200":0.7,"250":0.8,"300":1,"350":1.2,"400":1.3,"450":1.5,"500":1.6}'::jsonb);

    -- Efor Riro
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Efor Riro', 'Soup', 100)
    RETURNING id INTO recipe_3;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_3, 'Elo', 0.12, 'kg', 'Elo price per kg Lagos wholesale', '{"7":1.5,"14":3,"21":5,"28":6,"35":8,"42":9,"49":11,"56":12,"63":14,"70":15,"77":17,"84":18,"91":20,"98":21}'::jsonb),
    (recipe_3, 'Palm Oil', 0.04, 'litre', 'Palm Oil price per litre Lagos wholesale', '{"7":0.5,"14":1,"21":1.5,"28":2,"35":2.5,"42":3,"49":3.5,"56":4,"63":4.5,"70":5,"77":5.5,"84":6,"91":6.5,"98":7}'::jsonb),
    (recipe_3, 'Eja Kika', 0.008, 'kg', 'Eja Kika price per kg Lagos wholesale', '{"7":0.1,"14":0.2,"21":0.3,"28":0.4,"35":0.5,"42":0.6,"49":0.7,"56":0.8,"63":0.9,"70":1,"77":1.1,"84":1.2,"91":1.3,"98":1.4}'::jsonb),
    (recipe_3, 'Iru', 0.004, 'kg', 'Iru price per kg Lagos wholesale', '{"7":0.05,"14":0.1,"21":0.15,"28":0.2,"35":0.25,"42":0.3,"49":0.35,"56":0.4,"63":0.45,"70":0.5,"77":0.55,"84":0.6,"91":0.65,"98":0.7}'::jsonb),
    (recipe_3, 'Saki', 0.02, 'kg', 'Saki price per kg Lagos wholesale', '{"7":0.25,"14":0.5,"21":0.8,"28":1,"35":1.3,"42":1.5,"49":1.8,"56":2,"63":2.3,"70":2.5,"77":2.8,"84":3,"91":3.3,"98":3.5}'::jsonb),
    (recipe_3, 'Cow Leg', 0.02, 'kg', 'Cow Leg price per kg Lagos wholesale', '{"7":0.25,"14":0.5,"21":0.8,"28":1,"35":1.3,"42":1.5,"49":1.8,"56":2,"63":2.3,"70":2.5,"77":2.8,"84":3,"91":3.3,"98":3.5}'::jsonb),
    (recipe_3, 'Maggi', 0.004, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"7":0.04,"14":0.1,"21":0.2,"28":0.2,"35":0.2,"42":0.3,"49":0.3,"56":0.4,"63":0.4,"70":0.4,"77":0.5,"84":0.5,"91":0.6,"98":0.6}'::jsonb),
    (recipe_3, 'Salt', 0.002, 'kg', 'Salt price per kg Lagos wholesale', '{"7":0.017,"14":0.1,"21":0.1,"28":0.1,"35":0.1,"42":0.2,"49":0.2,"56":0.2,"63":0.2,"70":0.2,"77":0.2,"84":0.3,"91":0.3,"98":0.3}'::jsonb),
    (recipe_3, 'Onion', 0.04, 'kg', 'Onion price per kg Lagos wholesale', '{"7":0.5,"14":1,"21":1.5,"28":2,"35":2.5,"42":3,"49":3.5,"56":4,"63":4.5,"70":5,"77":5.5,"84":6,"91":6.5,"98":7}'::jsonb);

    -- Vegetable Salad
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Vegetable Salad', 'Salad', 100)
    RETURNING id INTO recipe_4;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_4, 'Cabbage', 0.14, 'kg', 'Cabbage price per kg Lagos wholesale', '{"10":1.4,"20":3,"50":7,"100":14,"150":21,"200":28,"250":35,"300":42,"350":49,"400":56,"450":63,"500":70}'::jsonb),
    (recipe_4, 'Lettuce', 0.02, 'kg', 'Lettuce price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_4, 'Cocumber', 0.02, 'kg', 'Cocumber price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_4, 'Carrot', 0.025, 'kg', 'Carrot price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.25,"100":2.5,"150":3.75,"200":5,"250":6.25,"300":7.5,"350":8.75,"400":10,"450":11.25,"500":12.5}'::jsonb),
    (recipe_4, 'Red Kidney', 0.025, 'kg', 'Red Kidney price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_4, 'Sweet Corn', 0.01, 'kg', 'Sweet Corn price per kg Lagos wholesale', '{"10":0.1,"20":0.2,"50":0.5,"100":1,"150":1.5,"200":2,"250":2.5,"300":3,"350":3.5,"400":4,"450":4.5,"500":5}'::jsonb),
    (recipe_4, 'Salad cream', 0.02, 'kg', 'Salad cream price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_4, 'Mayonaise', 0.01, 'kg', 'Mayonaise price per kg Lagos wholesale', '{"10":0.1,"20":0.2,"50":0.5,"100":1,"150":1.5,"200":2,"250":2.5,"300":3,"350":3.5,"400":4,"450":4.5,"500":5}'::jsonb),
    (recipe_4, 'Egg', 0.4, 'pcs', 'Egg price per pcs Lagos wholesale', '{"10":4,"20":8,"50":20,"100":40,"150":60,"200":80,"250":100,"300":120,"350":140,"400":160,"450":180,"500":200}'::jsonb),
    (recipe_4, 'Vineger', 0.34, 'kg', 'Vineger price per kg Lagos wholesale', '{"10":3.4,"20":6.8,"50":17,"100":34,"150":51,"200":68,"250":85,"300":102,"350":119,"400":136,"450":153,"500":170}'::jsonb);

    -- Chinese Fried Rice
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Chinese Fried Rice', 'Main Course', 100)
    RETURNING id INTO recipe_5;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_5, 'Basmatti', 0.1, 'kg', 'Basmatti price per kg Lagos wholesale', '{"5":0.5,"10":1,"20":2,"50":5,"100":10,"150":15,"200":20,"250":25,"300":30,"350":35,"400":40,"450":45,"500":50}'::jsonb),
    (recipe_5, 'Green Pepper', 0.07, 'kg', 'Green Pepper price per kg Lagos wholesale', '{"5":0.35,"10":0.7,"20":1.4,"50":3.5,"100":7,"150":10.5,"200":14,"250":17.5,"300":21,"350":24.5,"400":28,"450":31.5,"500":35}'::jsonb),
    (recipe_5, 'Spring Onion', 0.02, 'kg', 'Spring Onion price per kg Lagos wholesale', '{"5":0.1,"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_5, 'L. Fillet', 0.03, 'kg', 'L. Fillet price per kg Lagos wholesale', '{"5":0.15,"10":0.3,"20":0.6,"50":1.5,"100":3,"150":4.5,"200":6,"250":7.5,"300":9,"350":10.5,"400":12,"450":13.5,"500":15}'::jsonb),
    (recipe_5, 'Prawn', 0.03, 'kg', 'Prawn price per kg Lagos wholesale', '{"5":0.15,"10":0.3,"20":0.6,"50":1.5,"100":3,"150":4.5,"200":6,"250":7.5,"300":9,"350":10.5,"400":12,"450":13.5,"500":15}'::jsonb),
    (recipe_5, 'C. Fillet', 0.03, 'kg', 'C. Fillet price per kg Lagos wholesale', '{"5":0.15,"10":0.3,"20":0.6,"50":1.5,"100":3,"150":4.5,"200":6,"250":7.5,"300":9,"350":10.5,"400":12,"450":13.5,"500":15}'::jsonb),
    (recipe_5, 'Soy Sauce', 0.4, 'kg', 'Soy Sauce price per kg Lagos wholesale', '{"5":2,"10":4,"20":8,"50":20,"100":40,"150":60,"200":80,"250":100,"300":120,"350":140,"400":160,"450":180,"500":200}'::jsonb),
    (recipe_5, 'S. Chilli', 0.3, 'kg', 'S. Chilli price per kg Lagos wholesale', '{"5":1.5,"10":3,"20":6,"50":15,"100":30,"150":45,"200":60,"250":75,"300":90,"350":105,"400":120,"450":135,"500":150}'::jsonb),
    (recipe_5, 'Sesame', 0.2, 'kg', 'Sesame price per kg Lagos wholesale', '{"5":1,"10":2,"20":4,"50":10,"100":20,"150":30,"200":40,"250":50,"300":60,"350":70,"400":80,"450":90,"500":100}'::jsonb),
    (recipe_5, 'Oil', 0.007, 'litre', 'Oil price per litre Lagos wholesale', '{"5":0.034,"10":0.1,"20":0.2,"50":0.4,"100":0.7,"150":1.1,"200":1.4,"250":1.7,"300":2.1,"350":2.4,"400":2.8,"450":3.1,"500":3.4}'::jsonb),
    (recipe_5, 'Maggi', 0.012, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"5":0.056,"10":0.2,"20":0.3,"50":0.6,"100":1.2,"150":1.7,"200":2.3,"250":2.8,"300":3.4,"350":4,"400":4.5,"450":5.1,"500":5.6}'::jsonb),
    (recipe_5, 'Onion', 0.02, 'kg', 'Onion price per kg Lagos wholesale', '{"5":0.1,"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_5, 'Carrot', 0.05, 'kg', 'Carrot price per kg Lagos wholesale', '{"5":0.25,"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_5, 'Red Pepper', 0.04, 'kg', 'Red Pepper price per kg Lagos wholesale', '{"5":0.2,"10":0.4,"20":0.8,"50":2,"100":4,"150":6,"200":8,"250":10,"300":12,"350":14,"400":16,"450":18,"500":20}'::jsonb),
    (recipe_5, 'Sweet Corn', 0.02, 'kg', 'Sweet Corn price per kg Lagos wholesale', '{"5":0.1,"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb);

    -- Curry Chicken
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Curry Chicken', 'Main Course', 100)
    RETURNING id INTO recipe_6;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_6, 'Chicken', 0.15, 'kg', 'Chicken price per kg Lagos wholesale', '{"10":1.44,"20":3,"50":8,"100":15,"150":22,"200":29,"250":36,"300":44,"350":51,"400":58,"450":65,"500":72}'::jsonb),
    (recipe_6, 'Oil', 0.02, 'litre', 'Oil price per litre Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_6, 'Egg', 1, 'pcs', 'Egg price per pcs Lagos wholesale', '{"10":10,"20":20,"50":50,"100":100,"150":150,"200":200,"250":250,"300":300,"350":350,"400":400,"450":450,"500":500}'::jsonb),
    (recipe_6, 'Potato', 0.05, 'kg', 'Potato price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_6, 'Coconut', 0.1, 'kg', 'Coconut price per kg Lagos wholesale', '{"10":1,"20":2,"50":5,"100":10,"150":15,"200":20,"250":25,"300":30,"350":35,"400":40,"450":45,"500":50}'::jsonb),
    (recipe_6, 'Maggi', 0.01, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"10":0.1,"20":0.2,"50":0.5,"100":1,"150":1.5,"200":2,"250":2.5,"300":3,"350":3.5,"400":4,"450":4.5,"500":5}'::jsonb),
    (recipe_6, 'Carrot', 0.05, 'kg', 'Carrot price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_6, 'Onion', 0.05, 'kg', 'Onion price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_6, 'Green Pepper', 0.05, 'kg', 'Green Pepper price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_6, 'Red Pepper', 0.025, 'kg', 'Red Pepper price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_6, 'Curry', 0.017, 'kg', 'Curry price per kg Lagos wholesale', '{"10":0.17,"20":0.4,"50":0.9,"100":1.7,"150":2.6,"200":3.4,"250":4.3,"300":5.1,"350":6,"400":6.8,"450":7.7,"500":8.5}'::jsonb);

    -- Assorted Sauce
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Assorted Sauce', 'Side Dish', 100)
    RETURNING id INTO recipe_7;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_7, 'Elo', 0.2, 'kg', 'Elo price per kg Lagos wholesale', '{"10":2,"20":4,"50":10,"100":20,"150":30,"200":40,"250":50,"300":60,"350":70,"400":80,"450":90,"500":100}'::jsonb),
    (recipe_7, 'Meat', 0.06, 'kg', 'Meat price per kg Lagos wholesale', '{"10":0.6,"20":1.2,"50":3,"100":6,"150":9,"200":12,"250":15,"300":18,"350":21,"400":24,"450":27,"500":30}'::jsonb),
    (recipe_7, 'Saki', 0.025, 'kg', 'Saki price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_7, 'Cow Leg', 0.025, 'kg', 'Cow Leg price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.25,"100":2.5,"150":3.75,"200":5,"250":6.25,"300":7.5,"350":8.75,"400":10,"450":11.25,"500":12.5}'::jsonb),
    (recipe_7, 'Snail', 0.005, 'kg', 'Snail price per kg Lagos wholesale', '{"10":0.05,"20":0.1,"50":0.3,"100":0.5,"150":0.8,"200":1,"250":1.3,"300":1.5,"350":1.8,"400":2,"450":2.3,"500":2.5}'::jsonb),
    (recipe_7, 'Maggi', 0.003, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"10":0.03,"20":0.1,"50":0.2,"100":0.3,"150":0.5,"200":0.6,"250":0.8,"300":0.9,"350":1.1,"400":1.2,"450":1.4,"500":1.5}'::jsonb),
    (recipe_7, 'Paula', 0.025, 'kg', 'Paula price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_7, 'Salt', 0.001, 'kg', 'Salt price per kg Lagos wholesale', '{"10":0.0085,"20":0.1,"50":0.1,"100":0.1,"150":0.2,"200":0.2,"250":0.3,"300":0.3,"350":0.3,"400":0.4,"450":0.4,"500":0.5}'::jsonb),
    (recipe_7, 'Oil', 0.04, 'litre', 'Oil price per litre Lagos wholesale', '{"10":0.4,"20":0.8,"50":2,"100":4,"150":6,"200":8,"250":10,"300":12,"350":14,"400":16,"450":18,"500":20}'::jsonb),
    (recipe_7, 'Onion', 0.02, 'kg', 'Onion price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb);

    -- Xquisite Salad
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Xquisite Salad', 'Salad', 100)
    RETURNING id INTO recipe_8;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_8, 'Cabbage', 0.14, 'kg', 'Cabbage price per kg Lagos wholesale', '{"10":1.4,"20":3,"50":7,"100":14,"150":21,"200":28,"250":35,"300":42,"350":49,"400":56,"450":63,"500":70}'::jsonb),
    (recipe_8, 'Ice-Berg', 0.025, 'kg', 'Ice-Berg price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_8, 'Cherry Tomato', 0.025, 'kg', 'Cherry Tomato price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_8, 'Cocumber', 0.02, 'kg', 'Cocumber price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_8, 'Carrot', 0.025, 'kg', 'Carrot price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_8, 'Lettuce', 0.02, 'kg', 'Lettuce price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_8, 'Prawn', 0.025, 'kg', 'Prawn price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_8, 'Salad Cream', 0.02, 'kg', 'Salad Cream price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_8, 'Mayonaise', 0.01, 'kg', 'Mayonaise price per kg Lagos wholesale', '{"10":0.1,"20":0.2,"50":0.5,"100":1,"150":1.5,"200":2,"250":2.5,"300":3,"350":3.5,"400":4,"450":4.5,"500":5}'::jsonb),
    (recipe_8, 'Sweet Chilli', 0.1, 'kg', 'Sweet Chilli price per kg Lagos wholesale', '{"10":1,"20":2,"50":5,"100":10,"150":15,"200":20,"250":25,"300":30,"350":35,"400":40,"450":45,"500":50}'::jsonb),
    (recipe_8, 'Egg', 0.4, 'pcs', 'Egg price per pcs Lagos wholesale', '{"10":4,"20":8,"50":20,"100":40,"150":60,"200":80,"250":100,"300":120,"350":140,"400":160,"450":180,"500":200}'::jsonb);

    -- Moi-Moi
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Moi-Moi', 'Side Dish', 100)
    RETURNING id INTO recipe_9;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_9, 'Ewe', 0.1, 'kg', 'Ewe price per kg Lagos wholesale', '{"10":1,"20":2,"50":5,"100":10,"150":15,"200":20,"250":25,"300":30,"350":35,"400":40,"450":45,"500":50}'::jsonb),
    (recipe_9, 'Titus', 0.02, 'kg', 'Titus price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_9, 'Shombo', 0.05, 'kg', 'Shombo price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_9, 'Egg', 0.2, 'pcs', 'Egg price per pcs Lagos wholesale', '{"10":2,"20":4,"50":10,"100":20,"150":30,"200":40,"250":50,"300":60,"350":70,"400":80,"450":90,"500":100}'::jsonb),
    (recipe_9, 'Onions', 0.05, 'kg', 'Onions price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_9, 'Rodo', 0.02, 'kg', 'Rodo price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_9, 'Tatashe', 0.03, 'kg', 'Tatashe price per kg Lagos wholesale', '{"10":0.3,"20":0.6,"50":1.5,"100":3,"150":4.5,"200":6,"250":7.5,"300":9,"350":10.5,"400":12,"450":13.5,"500":15}'::jsonb),
    (recipe_9, 'Oil', 0.04, 'litre', 'Oil price per litre Lagos wholesale', '{"10":0.4,"20":0.8,"50":2,"100":4,"150":6,"200":8,"250":10,"300":12,"350":14,"400":16,"450":18,"500":20}'::jsonb),
    (recipe_9, 'Maggi', 0.007, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"10":0.064,"20":0.2,"50":0.4,"100":0.7,"150":1,"200":1.3,"250":1.6,"300":2,"350":2.3,"400":2.6,"450":2.9,"500":3.2}'::jsonb),
    (recipe_9, 'Salt', 0.002, 'kg', 'Salt price per kg Lagos wholesale', '{"10":0.017,"20":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.5,"300":0.6,"350":0.6,"400":0.7,"450":0.8,"500":0.9}'::jsonb),
    (recipe_9, 'Beans', 0.15, 'kg', 'Beans price per kg Lagos wholesale', '{"10":1.5,"20":3,"50":7.5,"100":15,"150":22.5,"200":30,"250":37.5,"300":45,"350":52.5,"400":60,"450":67.5,"500":75}'::jsonb);

    -- Yam Porridge
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Yam Porridge', 'Main Course', 100)
    RETURNING id INTO recipe_10;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_10, 'Palm Oil', 0.1, 'litre', 'Palm Oil price per litre Lagos wholesale', '{"5":0.5,"20":2,"50":5,"100":10,"150":15,"200":20,"250":25,"300":30,"350":35,"400":40,"450":45,"500":50}'::jsonb),
    (recipe_10, 'Dry Fish', 0.02, 'kg', 'Dry Fish price per kg Lagos wholesale', '{"5":0.1,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_10, 'Dry Pepper', 0.02, 'kg', 'Dry Pepper price per kg Lagos wholesale', '{"5":0.1,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_10, 'Maggi', 0.005, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"5":0.024,"20":0.1,"50":0.3,"100":0.5,"150":0.8,"200":1,"250":1.2,"300":1.5,"350":1.7,"400":2,"450":2.2,"500":2.4}'::jsonb),
    (recipe_10, 'Salt', 0.002, 'kg', 'Salt price per kg Lagos wholesale', '{"5":0.0085,"20":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.5,"300":0.6,"350":0.6,"400":0.7,"450":0.8,"500":0.9}'::jsonb),
    (recipe_10, 'Onion', 0.02, 'kg', 'Onion price per kg Lagos wholesale', '{"5":0.1,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_10, 'Yam', 0.6, 'kg', 'Yam price per kg Lagos wholesale', '{"5":3,"20":12,"50":30,"100":60,"150":90,"200":120,"250":150,"300":180,"350":210,"400":240,"450":270,"500":300}'::jsonb);

    -- Ofada Sauce
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Ofada Sauce', 'Sauce', 100)
    RETURNING id INTO recipe_11;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_11, 'Green Pepper', 0.1, 'kg', 'Green Pepper price per kg Lagos wholesale', '{"10":1,"20":2,"50":5,"100":10,"150":15,"200":20,"250":25,"300":30,"350":35,"400":40,"450":45,"500":50}'::jsonb),
    (recipe_11, 'Red Pepper', 0.1, 'kg', 'Red Pepper price per kg Lagos wholesale', '{"10":1,"20":2,"50":5,"100":10,"150":15,"200":20,"250":25,"300":30,"350":35,"400":40,"450":45,"500":50}'::jsonb),
    (recipe_11, 'Iru', 0.005, 'kg', 'Iru price per kg Lagos wholesale', '{"10":0.05,"20":0.1,"50":0.3,"100":0.5,"150":0.8,"200":1,"250":1.3,"300":1.5,"350":1.8,"400":2,"450":2.3,"500":2.5}'::jsonb),
    (recipe_11, 'Palm Oil', 0.1, 'litre', 'Palm Oil price per litre Lagos wholesale', '{"10":1,"20":2,"50":5,"100":10,"150":15,"200":20,"250":25,"300":30,"350":35,"400":40,"450":45,"500":50}'::jsonb),
    (recipe_11, 'Saki', 0.025, 'kg', 'Saki price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_11, 'Cow Leg', 0.025, 'kg', 'Cow Leg price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_11, 'Meat', 0.06, 'kg', 'Meat price per kg Lagos wholesale', '{"10":0.6,"20":1.2,"50":3,"100":6,"150":9,"200":12,"250":15,"300":18,"350":21,"400":24,"450":27,"500":30}'::jsonb),
    (recipe_11, 'Liver', 0.028, 'kg', 'Liver price per kg Lagos wholesale', '{"10":0.28,"20":0.6,"50":1.4,"100":2.8,"150":4.2,"200":5.6,"250":7,"300":8.4,"350":9.8,"400":11.2,"450":12.6,"500":14}'::jsonb),
    (recipe_11, 'Maggi', 0.005, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"10":0.048,"20":0.1,"50":0.3,"100":0.5,"150":0.8,"200":1,"250":1.2,"300":1.5,"350":1.7,"400":2,"450":2.2,"500":2.4}'::jsonb),
    (recipe_11, 'Salt', 0.002, 'kg', 'Salt price per kg Lagos wholesale', '{"10":0.017,"20":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.5,"300":0.6,"350":0.6,"400":0.7,"450":0.8,"500":0.9}'::jsonb),
    (recipe_11, 'Onions', 0.05, 'kg', 'Onions price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb);

    -- Seafood Platter
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Seafood Platter', 'Main Course', 100)
    RETURNING id INTO recipe_12;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_12, 'Okro', 0.15, 'kg', 'Okro price per kg Lagos wholesale', '{"10":1.5,"20":3,"50":8,"100":15,"150":23,"200":30,"250":38,"300":45,"350":53,"400":60,"450":68,"500":75}'::jsonb),
    (recipe_12, 'Prawn', 0.075, 'kg', 'Prawn price per kg Lagos wholesale', '{"10":0.75,"20":1.5,"50":3.8,"100":7.5,"150":11.3,"200":15,"250":18.8,"300":22.5,"350":26.3,"400":30,"450":33.8,"500":37.5}'::jsonb),
    (recipe_12, 'Ede Pupa', 0.015, 'kg', 'Ede Pupa price per kg Lagos wholesale', '{"10":0.15,"20":0.3,"50":0.8,"100":1.5,"150":2.3,"200":3,"250":3.8,"300":4.5,"350":5.3,"400":6,"450":6.8,"500":7.5}'::jsonb),
    (recipe_12, 'Eja Kika', 0.045, 'kg', 'Eja Kika price per kg Lagos wholesale', '{"10":0.45,"20":0.9,"50":2.25,"100":4.5,"150":6.75,"200":9,"250":11.25,"300":13.5,"350":15.75,"400":18,"450":20.25,"500":22.5}'::jsonb),
    (recipe_12, 'Iru', 0.002, 'kg', 'Iru price per kg Lagos wholesale', '{"10":0.017,"20":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.5,"300":0.6,"350":0.6,"400":0.7,"450":0.8,"500":0.9}'::jsonb),
    (recipe_12, 'Rodo', 0.015, 'kg', 'Rodo price per kg Lagos wholesale', '{"10":0.15,"20":0.3,"50":0.8,"100":1.5,"150":2.3,"200":3,"250":3.8,"300":4.5,"350":5.3,"400":6,"450":6.8,"500":7.5}'::jsonb),
    (recipe_12, 'Palm Oil', 0.04, 'litre', 'Palm Oil price per litre Lagos wholesale', '{"10":0.4,"20":0.8,"50":2,"100":4,"150":6,"200":8,"250":10,"300":12,"350":14,"400":16,"450":18,"500":20}'::jsonb),
    (recipe_12, 'Maggi', 0.008, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"10":0.072,"20":0.2,"50":0.4,"100":0.8,"150":1.1,"200":1.5,"250":1.8,"300":2.2,"350":2.6,"400":2.9,"450":3.3,"500":3.6}'::jsonb),
    (recipe_12, 'Salt', 0.002, 'kg', 'Salt price per kg Lagos wholesale', '{"10":0.017,"20":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.5,"300":0.6,"350":0.6,"400":0.7,"450":0.8,"500":0.9}'::jsonb);

    -- Roasted Potato
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Roasted Potato', 'Side Dish', 100)
    RETURNING id INTO recipe_13;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_13, 'Potato', 0.1, 'kg', 'Potato price per kg Lagos wholesale', '{"10":1,"20":2,"50":5,"100":10,"150":15,"200":20,"250":25,"300":30,"350":35,"400":40,"450":45,"500":50}'::jsonb),
    (recipe_13, 'Oil', 0.005, 'litre', 'Oil price per litre Lagos wholesale', '{"10":0.05,"20":0.1,"50":0.3,"100":0.5,"150":0.8,"200":1,"250":1.3,"300":1.5,"350":1.8,"400":2,"450":2.3,"500":2.5}'::jsonb),
    (recipe_13, 'Parsley', 0.01, 'kg', 'Parsley price per kg Lagos wholesale', '{"10":0.1,"20":0.2,"50":0.5,"100":1,"150":1.5,"200":2,"250":2.5,"300":3,"350":3.5,"400":4,"450":4.5,"500":5}'::jsonb),
    (recipe_13, 'Maggi', 0.0016, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"10":0.016,"20":0.04,"50":0.08,"100":0.16,"150":0.24,"200":0.32,"250":0.4,"300":0.48,"350":0.56,"400":0.64,"450":0.72,"500":0.8}'::jsonb);

    -- Chicken Stew
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Chicken Stew', 'Stew', 100)
    RETURNING id INTO recipe_14;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_14, 'Chicken', 0.07, 'kg', 'Chicken price per kg Lagos wholesale', '{"10":0.625,"20":2,"50":4,"100":7,"150":10,"200":13,"250":16,"300":19,"350":22,"400":25,"450":29,"500":32}'::jsonb),
    (recipe_14, 'Elo', 0.075, 'kg', 'Elo price per kg Lagos wholesale', '{"10":0.75,"20":1.5,"50":3.8,"100":7.5,"150":11.3,"200":15,"250":18.8,"300":22.5,"350":26.3,"400":30,"450":33.8,"500":37.5}'::jsonb),
    (recipe_14, 'Onion', 0.025, 'kg', 'Onion price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_14, 'Maggi', 0.0024, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"10":0.024,"20":0.05,"50":0.12,"100":0.24,"150":0.36,"200":0.48,"250":0.6,"300":0.72,"350":0.84,"400":0.96,"450":1.08,"500":1.2}'::jsonb),
    (recipe_14, 'Salt', 0.002, 'kg', 'Salt price per kg Lagos wholesale', '{"10":0.017,"20":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.5,"300":0.6,"350":0.6,"400":0.7,"450":0.8,"500":0.9}'::jsonb);

    -- Beef Stew
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Beef Stew', 'Stew', 100)
    RETURNING id INTO recipe_15;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_15, 'Meat', 0.05, 'kg', 'Meat price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":3,"100":5,"150":8,"200":10,"250":13,"300":15,"350":18,"400":20,"450":23,"500":25}'::jsonb),
    (recipe_15, 'Elo', 0.05, 'kg', 'Elo price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_15, 'Maggi', 0.003, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"10":0.024,"20":0.1,"50":0.2,"100":0.3,"150":0.4,"200":0.5,"250":0.6,"300":0.8,"350":0.9,"400":1,"450":1.1,"500":1.2}'::jsonb),
    (recipe_15, 'Salt', 0.0017, 'kg', 'Salt price per kg Lagos wholesale', '{"10":0.017,"20":0.04,"50":0.09,"100":0.17,"150":0.26,"200":0.34,"250":0.43,"300":0.51,"350":0.6,"400":0.68,"450":0.77,"500":0.85}'::jsonb),
    (recipe_15, 'Oil', 0.02, 'litre', 'Oil price per litre Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_15, 'Onion', 0.015, 'kg', 'Onion price per kg Lagos wholesale', '{"10":0.15,"20":0.3,"50":0.8,"100":1.5,"150":2.3,"200":3,"250":3.8,"300":4.5,"350":5.3,"400":6,"450":6.8,"500":7.5}'::jsonb);

    -- Fried Fish
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Fried Fish', 'Main Course', 100)
    RETURNING id INTO recipe_16;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_16, 'Elo', 0.05, 'kg', 'Elo price per kg Lagos wholesale', '{"35":2,"50":3,"100":5,"150":7,"200":10,"250":12,"300":14,"350":16,"400":19,"450":21,"500":23,"17.5":0.8}'::jsonb),
    (recipe_16, 'Oil', 0.012, 'litre', 'Oil price per litre Lagos wholesale', '{"35":0.4,"50":0.6,"100":1.2,"150":1.8,"200":2.3,"250":2.9,"300":3.5,"350":4,"400":4.6,"450":5.2,"500":5.8,"17.5":0.2}'::jsonb),
    (recipe_16, 'Maggi', 0.002, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"35":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.3,"250":0.4,"300":0.5,"350":0.5,"400":0.6,"450":0.7,"500":0.7,"17.5":0.024}'::jsonb),
    (recipe_16, 'Salt', 0.001, 'kg', 'Salt price per kg Lagos wholesale', '{"35":0.04,"50":0.05,"100":0.1,"150":0.15,"200":0.2,"250":0.25,"300":0.3,"350":0.34,"400":0.39,"450":0.44,"500":0.49,"17.5":0.017}'::jsonb),
    (recipe_16, 'Onion', 0.006, 'kg', 'Onion price per kg Lagos wholesale', '{"35":0.2,"50":0.3,"100":0.6,"150":0.9,"200":1.2,"250":1.5,"300":1.8,"350":2,"400":2.3,"450":2.6,"500":2.9,"17.5":0.1}'::jsonb),
    (recipe_16, 'Croacker Fish', 0.001, 'kg', 'Croacker Fish price per kg Lagos wholesale', '{"35":0.1,"50":0.1,"100":0.1,"150":0.1,"200":0.1,"250":0.1,"300":0.1,"350":0.1,"400":0.1,"450":0.2,"500":0.2,"17.5":0.004}'::jsonb);

    -- Semolina (Semo)
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Semolina (Semo)', 'Swallow', 100)
    RETURNING id INTO recipe_17;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_17, 'Semo', 0.06, 'kg', 'Semo price per kg Lagos wholesale', '{"10":0.6,"20":2,"50":3,"100":6,"150":9,"200":12,"250":15,"300":18,"350":21,"400":24,"450":27,"500":30}'::jsonb),
    (recipe_17, 'Nylon', 1, 'kg', 'Nylon price per kg Lagos wholesale', '{"10":10,"20":20,"50":50,"100":100,"150":150,"200":200,"250":250,"300":300,"350":350,"400":400,"450":450,"500":500}'::jsonb);

    -- Wheat Meal
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Wheat Meal', 'Swallow', 100)
    RETURNING id INTO recipe_18;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_18, 'Wheat', 0.1, 'kg', 'Wheat price per kg Lagos wholesale', '{"10":1,"20":2,"50":5,"100":10,"150":15,"200":20,"250":25,"300":30,"350":35,"400":40,"450":45,"500":50}'::jsonb),
    (recipe_18, 'Nylon', 1, 'kg', 'Nylon price per kg Lagos wholesale', '{"10":10,"20":20,"50":50,"100":100,"150":150,"200":200,"250":250,"300":300,"350":350,"400":400,"450":450,"500":500}'::jsonb);

    -- Shredded Beef
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Shredded Beef', 'Side Dish', 100)
    RETURNING id INTO recipe_19;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_19, 'Beef', 0.1, 'kg', 'Beef price per kg Lagos wholesale', '{"10":1,"20":2,"50":5,"100":10,"150":15,"200":20,"250":25,"300":30,"350":35,"400":40,"450":45,"500":50}'::jsonb),
    (recipe_19, 'Maggi', 0.002, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"10":0.016,"20":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.4,"300":0.5,"350":0.6,"400":0.7,"450":0.8,"500":0.8}'::jsonb),
    (recipe_19, 'Oil', 0.02, 'litre', 'Oil price per litre Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_19, 'Oyster', 0.0034, 'kg', 'Oyster price per kg Lagos wholesale', '{"10":0.034,"20":0.07,"50":0.17,"100":0.34,"150":0.51,"200":0.68,"250":0.85,"300":1.02,"350":1.19,"400":1.36,"450":1.53,"500":1.7}'::jsonb),
    (recipe_19, 'Hoisin Sauce', 0.002, 'kg', 'Hoisin Sauce price per kg Lagos wholesale', '{"10":0.017,"20":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.5,"300":0.6,"350":0.6,"400":0.7,"450":0.8,"500":0.9}'::jsonb),
    (recipe_19, 'Sesame oil', 0.002, 'litre', 'Sesame oil price per litre Lagos wholesale', '{"10":0.017,"20":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.5,"300":0.6,"350":0.6,"400":0.7,"450":0.8,"500":0.9}'::jsonb);

    -- Fettuccine Pasta
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Fettuccine Pasta', 'Main Course', 100)
    RETURNING id INTO recipe_20;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_20, 'Pasta', 0.05, 'kg', 'Pasta price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":3,"100":5,"150":8,"200":10,"250":13,"300":15,"350":18,"400":20,"450":23,"500":25}'::jsonb),
    (recipe_20, 'Green Pepper', 0.025, 'kg', 'Green Pepper price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_20, 'Maggi', 0.002, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"10":0.016,"20":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.4,"300":0.5,"350":0.6,"400":0.7,"450":0.8,"500":0.8}'::jsonb),
    (recipe_20, 'Oil', 0.005, 'litre', 'Oil price per litre Lagos wholesale', '{"10":0.05,"20":0.1,"50":0.25,"100":0.5,"150":0.75,"200":1,"250":1.25,"300":1.5,"350":1.75,"400":2,"450":2.25,"500":2.5}'::jsonb),
    (recipe_20, 'Red Pepper', 0.025, 'kg', 'Red Pepper price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_20, 'Whiippin G Cream', 0.05, 'kg', 'Whiippin G Cream price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb);

    -- Grilled Prawns
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Grilled Prawns', 'Appetizer', 100)
    RETURNING id INTO recipe_21;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_21, 'Unpeeled Prawn', 0.05, 'kg', 'Unpeeled Prawn price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":3,"100":5,"150":8,"200":10,"250":13,"300":15,"350":18,"400":20,"450":23,"500":25}'::jsonb),
    (recipe_21, 'Maggi', 0.001, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"10":0.008,"20":0.1,"50":0.1,"100":0.1,"150":0.2,"200":0.2,"250":0.2,"300":0.3,"350":0.3,"400":0.4,"450":0.4,"500":0.4}'::jsonb),
    (recipe_21, 'Rodo', 0.001, 'kg', 'Rodo price per kg Lagos wholesale', '{"10":0.01,"20":0.1,"50":0.1,"100":0.1,"150":0.2,"200":0.2,"250":0.3,"300":0.3,"350":0.4,"400":0.4,"450":0.5,"500":0.5}'::jsonb),
    (recipe_21, 'Coloured Pepper', 0.005, 'kg', 'Coloured Pepper price per kg Lagos wholesale', '{"10":0.05,"20":0.1,"50":0.25,"100":0.5,"150":0.75,"200":1,"250":1.25,"300":1.5,"350":1.75,"400":2,"450":2.25,"500":2.5}'::jsonb),
    (recipe_21, 'S. Chilli', 0.002, 'kg', 'S. Chilli price per kg Lagos wholesale', '{"10":0.017,"20":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.5,"300":0.6,"350":0.6,"400":0.7,"450":0.8,"500":0.9}'::jsonb);

    -- Egusi Soup
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Egusi Soup', 'Soup', 100)
    RETURNING id INTO recipe_22;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_22, 'Ugwu', 0.04, 'kg', 'Ugwu price per kg Lagos wholesale', '{"7":0.5,"14":1,"21":2,"28":2,"35":3,"42":3,"49":4,"56":4,"63":5,"70":5,"77":6,"84":6,"91":7,"98":7}'::jsonb),
    (recipe_22, 'Egusi', 0.08, 'kg', 'Egusi price per kg Lagos wholesale', '{"7":1,"14":2,"21":3,"28":4,"35":5,"42":6,"49":7,"56":8,"63":9,"70":10,"77":11,"84":12,"91":13,"98":14}'::jsonb),
    (recipe_22, 'Iru', 0.008, 'kg', 'Iru price per kg Lagos wholesale', '{"7":0.1,"14":0.2,"21":0.3,"28":0.4,"35":0.5,"42":0.6,"49":0.7,"56":0.8,"63":0.9,"70":1,"77":1.1,"84":1.2,"91":1.3,"98":1.4}'::jsonb),
    (recipe_22, 'Palm Oil', 0.032, 'litre', 'Palm Oil price per litre Lagos wholesale', '{"7":0.4,"14":0.8,"21":1.2,"28":1.6,"35":2,"42":2.4,"49":2.8,"56":3.2,"63":3.6,"70":4,"77":4.4,"84":4.8,"91":5.2,"98":5.6}'::jsonb),
    (recipe_22, 'Ata Rodo', 0.04, 'kg', 'Ata Rodo price per kg Lagos wholesale', '{"7":0.5,"14":1,"21":1.5,"28":2,"35":2.5,"42":3,"49":3.5,"56":4,"63":4.5,"70":5,"77":5.5,"84":6,"91":6.5,"98":7}'::jsonb),
    (recipe_22, 'Eja Kika', 0.016, 'kg', 'Eja Kika price per kg Lagos wholesale', '{"7":0.2,"14":0.4,"21":0.6,"28":0.8,"35":1,"42":1.2,"49":1.4,"56":1.6,"63":1.8,"70":2,"77":2.2,"84":2.4,"91":2.6,"98":2.8}'::jsonb),
    (recipe_22, 'Saki', 0.02, 'kg', 'Saki price per kg Lagos wholesale', '{"7":0.25,"14":0.5,"21":0.8,"28":1,"35":1.3,"42":1.5,"49":1.8,"56":2,"63":2.3,"70":2.5,"77":2.8,"84":3,"91":3.3,"98":3.5}'::jsonb),
    (recipe_22, 'Cow Leg', 0.02, 'kg', 'Cow Leg price per kg Lagos wholesale', '{"7":0.25,"14":0.5,"21":0.8,"28":1,"35":1.3,"42":1.5,"49":1.8,"56":2,"63":2.3,"70":2.5,"77":2.8,"84":3,"91":3.3,"98":3.5}'::jsonb),
    (recipe_22, 'Onion', 0.004, 'kg', 'Onion price per kg Lagos wholesale', '{"7":0.05,"14":0.1,"21":0.2,"28":0.2,"35":0.3,"42":0.3,"49":0.4,"56":0.4,"63":0.5,"70":0.5,"77":0.6,"84":0.6,"91":0.7,"98":0.7}'::jsonb);

    -- Bean Porridge
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Bean Porridge', 'Side Dish', 100)
    RETURNING id INTO recipe_23;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_23, 'Bean', 0.2, 'kg', 'Bean price per kg Lagos wholesale', '{"10":2,"20":4,"50":10,"100":20,"150":30,"200":40,"250":50,"300":60,"350":70,"400":80,"450":90,"500":100}'::jsonb),
    (recipe_23, 'Palm Oil', 0.04, 'litre', 'Palm Oil price per litre Lagos wholesale', '{"10":0.4,"20":0.8,"50":2,"100":4,"150":6,"200":8,"250":10,"300":12,"350":14,"400":16,"450":18,"500":20}'::jsonb),
    (recipe_23, 'Eja Kika', 0.01, 'kg', 'Eja Kika price per kg Lagos wholesale', '{"10":0.1,"20":0.2,"50":0.5,"100":1,"150":1.5,"200":2,"250":2.5,"300":3,"350":3.5,"400":4,"450":4.5,"500":5}'::jsonb),
    (recipe_23, 'Plantain', 0.015, 'kg', 'Plantain price per kg Lagos wholesale', '{"10":0.15,"20":0.3,"50":0.75,"100":1.5,"150":2.25,"200":3,"250":3.75,"300":4.5,"350":5.25,"400":6,"450":6.75,"500":7.5}'::jsonb),
    (recipe_23, 'Maggi', 0.002, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"10":0.016,"20":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.4,"300":0.5,"350":0.6,"400":0.7,"450":0.8,"500":0.8}'::jsonb),
    (recipe_23, 'Onions', 0.005, 'kg', 'Onions price per kg Lagos wholesale', '{"10":0.05,"20":0.1,"50":0.3,"100":0.5,"150":0.8,"200":1,"250":1.3,"300":1.5,"350":1.8,"400":2,"450":2.3,"500":2.5}'::jsonb);

    -- White Beans
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'White Beans', 'Side Dish', 100)
    RETURNING id INTO recipe_24;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_24, 'Bean', 0.2, 'kg', 'Bean price per kg Lagos wholesale', '{"10":2,"20":4,"50":10,"100":20,"150":30,"200":40,"250":50,"300":60,"350":70,"400":80,"450":90,"500":100}'::jsonb),
    (recipe_24, 'Salt', 0.002, 'kg', 'Salt price per kg Lagos wholesale', '{"10":0.017,"20":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.5,"300":0.6,"350":0.6,"400":0.7,"450":0.8,"500":0.9}'::jsonb),
    (recipe_24, 'Dry Pepper', 0.01, 'kg', 'Dry Pepper price per kg Lagos wholesale', '{"10":0.1,"20":0.2,"50":0.5,"100":1,"150":1.5,"200":2,"250":2.5,"300":3,"350":3.5,"400":4,"450":4.5,"500":5}'::jsonb),
    (recipe_24, 'Dry Fish', 0.02, 'kg', 'Dry Fish price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_24, 'Palm Oil', 0.04, 'litre', 'Palm Oil price per litre Lagos wholesale', '{"10":0.4,"20":0.8,"50":2,"100":4,"150":6,"200":8,"250":10,"300":12,"350":14,"400":16,"450":18,"500":20}'::jsonb),
    (recipe_24, 'Onions', 0.005, 'kg', 'Onions price per kg Lagos wholesale', '{"10":0.05,"20":0.1,"50":0.3,"100":0.5,"150":0.8,"200":1,"250":1.3,"300":1.5,"350":1.8,"400":2,"450":2.3,"500":2.5}'::jsonb),
    (recipe_24, 'Maggi', 0.002, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"10":0.016,"20":0.1,"50":0.1,"100":0.2,"150":0.3,"200":0.4,"250":0.4,"300":0.5,"350":0.6,"400":0.7,"450":0.8,"500":0.8}'::jsonb);

    -- Poundo Yam
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Poundo Yam', 'Swallow', 100)
    RETURNING id INTO recipe_25;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_25, 'Poundo', 0.1, 'kg', 'Poundo price per kg Lagos wholesale', '{"10":1,"20":2,"50":5,"100":10,"150":15,"200":20,"250":25,"300":30,"350":35,"400":40,"450":45,"500":50}'::jsonb),
    (recipe_25, 'Nylon', 1, 'kg', 'Nylon price per kg Lagos wholesale', '{"10":10,"20":20,"50":50,"100":100,"150":150,"200":200,"250":250,"300":300,"350":350,"400":400,"450":450,"500":500}'::jsonb);

    -- Nigerian Menu - Option A
    INSERT INTO recipes (id, organization_id, name, category, base_portions)
    VALUES (gen_random_uuid(), org_id, 'Nigerian Menu - Option A', 'Package', 100)
    RETURNING id INTO recipe_26;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_name, qty_per_portion, unit, price_source_query, scaling_tiers) VALUES
    (recipe_26, 'RICE', 0.03, 'kg', 'RICE price per kg Lagos wholesale', '{"35":1,"50":1.5,"100":3,"150":4.5,"200":6,"250":7.5,"300":9,"350":10,"400":11.5,"450":13,"500":14.5,"17.5":0.5}'::jsonb),
    (recipe_26, 'Tomato puree', 0.009, 'litre', 'Tomato puree price per litre Lagos wholesale', '{"35":0.3,"50":0.45,"100":0.9,"150":1.3,"200":1.75,"250":2.15,"300":2.6,"350":3,"400":3.45,"450":3.9,"500":4.3,"17.5":0.15}'::jsonb),
    (recipe_26, 'Whole Tomato', 0.0115, 'kg', 'Whole Tomato price per kg Lagos wholesale', '{"35":0.4,"50":0.6,"100":1.15,"150":1.75,"200":2.3,"250":2.9,"300":3.45,"350":4,"400":4.6,"450":5.15,"500":5.75,"17.5":0.2}'::jsonb),
    (recipe_26, 'Whole Red Pepper', 0.0022, 'kg', 'Whole Red Pepper price per kg Lagos wholesale', '{"35":0.075,"50":0.11,"100":0.215,"150":0.325,"200":0.43,"250":0.54,"300":0.645,"350":0.75,"400":0.86,"450":0.965,"500":1.075,"17.5":0.0375}'::jsonb),
    (recipe_26, 'Ata Rodo', 0.003, 'kg', 'Ata Rodo price per kg Lagos wholesale', '{"35":0.1,"50":0.15,"100":0.3,"150":0.45,"200":0.6,"250":0.75,"300":0.9,"350":1,"400":1.15,"450":1.3,"500":1.45,"17.5":0.05}'::jsonb),
    (recipe_26, 'Groundnut Oil', 0.006, 'litre', 'Groundnut Oil price per litre Lagos wholesale', '{"35":0.2,"50":0.3,"100":0.6,"150":0.9,"200":1.15,"250":1.45,"300":1.75,"350":2,"400":2.3,"450":2.6,"500":2.9,"17.5":0.1}'::jsonb),
    (recipe_26, 'Onions', 0.0575, 'kg', 'Onions price per kg Lagos wholesale', '{"10":0.5,"20":1,"35":0.25,"50":2.9,"100":5.75,"150":8.6,"200":11.45,"250":14.3,"300":17.15,"350":20,"400":22.9,"450":25.75,"500":28.6,"17.5":0.125}'::jsonb),
    (recipe_26, 'Salt', 0.0062, 'kg', 'Salt price per kg Lagos wholesale', '{"10":0.051,"20":0.24,"35":0.05,"50":0.34,"100":0.62,"150":0.96,"200":1.24,"250":1.58,"300":1.86,"350":2,"400":2.28,"450":2.62,"500":2.9,"17.5":0.0085}'::jsonb),
    (recipe_26, 'Maggi', 0.0194, 'cubes', 'Maggi price per cubes Lagos wholesale', '{"5":0.028,"10":0.212,"20":0.5,"35":0.05,"50":1.07,"100":1.94,"150":2.76,"200":3.63,"250":4.4,"300":5.47,"350":6.34,"400":7.16,"450":8.03,"500":8.8,"17.5":0.014}'::jsonb),
    (recipe_26, 'Basmatti', 0.05, 'kg', 'Basmatti price per kg Lagos wholesale', '{"5":0.25,"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_26, 'Green Pepper', 0.035, 'kg', 'Green Pepper price per kg Lagos wholesale', '{"5":0.175,"10":0.35,"20":0.7,"50":1.75,"100":3.5,"150":5.25,"200":7,"250":8.75,"300":10.5,"350":12.25,"400":14,"450":15.75,"500":17.5}'::jsonb),
    (recipe_26, 'Spring Onion', 0.01, 'kg', 'Spring Onion price per kg Lagos wholesale', '{"5":0.05,"10":0.1,"20":0.2,"50":0.5,"100":1,"150":1.5,"200":2,"250":2.5,"300":3,"350":3.5,"400":4,"450":4.5,"500":5}'::jsonb),
    (recipe_26, 'L. Fillet', 0.015, 'kg', 'L. Fillet price per kg Lagos wholesale', '{"5":0.075,"10":0.15,"20":0.3,"50":0.75,"100":1.5,"150":2.25,"200":3,"250":3.75,"300":4.5,"350":5.25,"400":6,"450":6.75,"500":7.5}'::jsonb),
    (recipe_26, 'Prawn', 0.015, 'kg', 'Prawn price per kg Lagos wholesale', '{"5":0.075,"10":0.15,"20":0.3,"50":0.75,"100":1.5,"150":2.25,"200":3,"250":3.75,"300":4.5,"350":5.25,"400":6,"450":6.75,"500":7.5}'::jsonb),
    (recipe_26, 'C. Fillet', 0.015, 'kg', 'C. Fillet price per kg Lagos wholesale', '{"5":0.075,"10":0.15,"20":0.3,"50":0.75,"100":1.5,"150":2.25,"200":3,"250":3.75,"300":4.5,"350":5.25,"400":6,"450":6.75,"500":7.5}'::jsonb),
    (recipe_26, 'Soy Sauce', 0.2, 'kg', 'Soy Sauce price per kg Lagos wholesale', '{"5":1,"10":2,"20":4,"50":10,"100":20,"150":30,"200":40,"250":50,"300":60,"350":70,"400":80,"450":90,"500":100}'::jsonb),
    (recipe_26, 'S. Chilli', 0.15, 'kg', 'S. Chilli price per kg Lagos wholesale', '{"5":0.75,"10":1.5,"20":3,"50":7.5,"100":15,"150":22.5,"200":30,"250":37.5,"300":45,"350":52.5,"400":60,"450":67.5,"500":75}'::jsonb),
    (recipe_26, 'Sesame', 0.1, 'kg', 'Sesame price per kg Lagos wholesale', '{"5":0.5,"10":1,"20":2,"50":5,"100":10,"150":15,"200":20,"250":25,"300":30,"350":35,"400":40,"450":45,"500":50}'::jsonb),
    (recipe_26, 'Oil', 0.0635, 'litre', 'Oil price per litre Lagos wholesale', '{"5":0.017,"10":0.65,"20":1.3,"50":3.2,"100":6.35,"150":9.55,"200":12.7,"250":15.85,"300":19.05,"350":22.2,"400":25.4,"450":28.55,"500":31.7}'::jsonb),
    (recipe_26, 'Onion', 0.05, 'kg', 'Onion price per kg Lagos wholesale', '{"5":0.05,"10":0.5,"20":1,"50":2.6,"100":5,"150":7.6,"200":10,"250":12.6,"300":15,"350":17.6,"400":20,"450":22.6,"500":25}'::jsonb),
    (recipe_26, 'Carrot', 0.05, 'kg', 'Carrot price per kg Lagos wholesale', '{"5":0.125,"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_26, 'Red Pepper', 0.02, 'kg', 'Red Pepper price per kg Lagos wholesale', '{"5":0.1,"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_26, 'Sweet Corn', 0.02, 'kg', 'Sweet Corn price per kg Lagos wholesale', '{"5":0.05,"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_26, 'Chicken', 0.07, 'kg', 'Chicken price per kg Lagos wholesale', '{"10":0.625,"20":2,"50":4,"100":7,"150":10,"200":13,"250":16,"300":19,"350":22,"400":25,"450":29,"500":32}'::jsonb),
    (recipe_26, 'Elo', 0.125, 'kg', 'Elo price per kg Lagos wholesale', '{"10":1.25,"20":2.5,"50":6.3,"100":12.5,"150":18.8,"200":25,"250":31.3,"300":37.5,"350":43.8,"400":50,"450":56.3,"500":62.5}'::jsonb),
    (recipe_26, 'Meat', 0.05, 'kg', 'Meat price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":3,"100":5,"150":8,"200":10,"250":13,"300":15,"350":18,"400":20,"450":23,"500":25}'::jsonb),
    (recipe_26, 'Cabbage', 0.14, 'kg', 'Cabbage price per kg Lagos wholesale', '{"10":1.4,"20":3,"50":7,"100":14,"150":21,"200":28,"250":35,"300":42,"350":49,"400":56,"450":63,"500":70}'::jsonb),
    (recipe_26, 'Lettuce', 0.02, 'kg', 'Lettuce price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_26, 'Cocumber', 0.02, 'kg', 'Cocumber price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_26, 'Red Kidney', 0.025, 'kg', 'Red Kidney price per kg Lagos wholesale', '{"10":0.25,"20":0.5,"50":1.3,"100":2.5,"150":3.8,"200":5,"250":6.3,"300":7.5,"350":8.8,"400":10,"450":11.3,"500":12.5}'::jsonb),
    (recipe_26, 'Salad cream', 0.02, 'kg', 'Salad cream price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_26, 'Mayonaise', 0.01, 'kg', 'Mayonaise price per kg Lagos wholesale', '{"10":0.1,"20":0.2,"50":0.5,"100":1,"150":1.5,"200":2,"250":2.5,"300":3,"350":3.5,"400":4,"450":4.5,"500":5}'::jsonb),
    (recipe_26, 'Egg', 0.6, 'pcs', 'Egg price per pcs Lagos wholesale', '{"10":6,"20":12,"50":30,"100":60,"150":90,"200":120,"250":150,"300":180,"350":210,"400":240,"450":270,"500":300}'::jsonb),
    (recipe_26, 'Vineger', 0.34, 'kg', 'Vineger price per kg Lagos wholesale', '{"10":3.4,"20":6.8,"50":17,"100":34,"150":51,"200":68,"250":85,"300":102,"350":119,"400":136,"450":153,"500":170}'::jsonb),
    (recipe_26, 'Ewe', 0.1, 'kg', 'Ewe price per kg Lagos wholesale', '{"10":1,"20":2,"50":5,"100":10,"150":15,"200":20,"250":25,"300":30,"350":35,"400":40,"450":45,"500":50}'::jsonb),
    (recipe_26, 'Titus', 0.02, 'kg', 'Titus price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_26, 'Shombo', 0.05, 'kg', 'Shombo price per kg Lagos wholesale', '{"10":0.5,"20":1,"50":2.5,"100":5,"150":7.5,"200":10,"250":12.5,"300":15,"350":17.5,"400":20,"450":22.5,"500":25}'::jsonb),
    (recipe_26, 'Rodo', 0.02, 'kg', 'Rodo price per kg Lagos wholesale', '{"10":0.2,"20":0.4,"50":1,"100":2,"150":3,"200":4,"250":5,"300":6,"350":7,"400":8,"450":9,"500":10}'::jsonb),
    (recipe_26, 'Tatashe', 0.03, 'kg', 'Tatashe price per kg Lagos wholesale', '{"10":0.3,"20":0.6,"50":1.5,"100":3,"150":4.5,"200":6,"250":7.5,"300":9,"350":10.5,"400":12,"450":13.5,"500":15}'::jsonb),
    (recipe_26, 'Beans', 0.15, 'kg', 'Beans price per kg Lagos wholesale', '{"10":1.5,"20":3,"50":7.5,"100":15,"150":22.5,"200":30,"250":37.5,"300":45,"350":52.5,"400":60,"450":67.5,"500":75}'::jsonb);

    -- Link recipes to products
    UPDATE products SET recipe_id = recipe_0 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%jollof%' AND LOWER(name) LIKE '%rice%');
    UPDATE products SET recipe_id = recipe_1 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%prawn%' AND LOWER(name) LIKE '%calamari%');
    UPDATE products SET recipe_id = recipe_2 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%sweet%' AND LOWER(name) LIKE '%sour%' AND LOWER(name) LIKE '%chicken%');
    UPDATE products SET recipe_id = recipe_3 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%efor%' AND LOWER(name) LIKE '%riro%');
    UPDATE products SET recipe_id = recipe_4 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%vegetable%' AND LOWER(name) LIKE '%salad%');
    UPDATE products SET recipe_id = recipe_5 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%chinese%' AND LOWER(name) LIKE '%fried%' AND LOWER(name) LIKE '%rice%');
    UPDATE products SET recipe_id = recipe_6 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%curry%' AND LOWER(name) LIKE '%chicken%');
    UPDATE products SET recipe_id = recipe_7 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%assorted%' AND LOWER(name) LIKE '%sauce%');
    UPDATE products SET recipe_id = recipe_8 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%xquisite%' AND LOWER(name) LIKE '%salad%');
    UPDATE products SET recipe_id = recipe_9 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%moi-moi%');
    UPDATE products SET recipe_id = recipe_10 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%porridge%');
    UPDATE products SET recipe_id = recipe_11 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%ofada%' AND LOWER(name) LIKE '%sauce%');
    UPDATE products SET recipe_id = recipe_12 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%seafood%' AND LOWER(name) LIKE '%platter%');
    UPDATE products SET recipe_id = recipe_13 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%roasted%' AND LOWER(name) LIKE '%potato%');
    UPDATE products SET recipe_id = recipe_14 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%chicken%' AND LOWER(name) LIKE '%stew%');
    UPDATE products SET recipe_id = recipe_15 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%beef%' AND LOWER(name) LIKE '%stew%');
    UPDATE products SET recipe_id = recipe_16 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%fried%' AND LOWER(name) LIKE '%fish%');
    UPDATE products SET recipe_id = recipe_17 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%semolina%' AND LOWER(name) LIKE '%(semo)%');
    UPDATE products SET recipe_id = recipe_18 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%wheat%' AND LOWER(name) LIKE '%meal%');
    UPDATE products SET recipe_id = recipe_19 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%shredded%' AND LOWER(name) LIKE '%beef%');
    UPDATE products SET recipe_id = recipe_20 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%fettuccine%' AND LOWER(name) LIKE '%pasta%');
    UPDATE products SET recipe_id = recipe_21 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%grilled%' AND LOWER(name) LIKE '%prawns%');
    UPDATE products SET recipe_id = recipe_22 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%egusi%' AND LOWER(name) LIKE '%soup%');
    UPDATE products SET recipe_id = recipe_23 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%bean%' AND LOWER(name) LIKE '%porridge%');
    UPDATE products SET recipe_id = recipe_24 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%white%' AND LOWER(name) LIKE '%beans%');
    UPDATE products SET recipe_id = recipe_25 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%poundo%');
    UPDATE products SET recipe_id = recipe_26 WHERE organization_id = org_id AND recipe_id IS NULL AND (LOWER(name) LIKE '%nigerian%' AND LOWER(name) LIKE '%menu%' AND LOWER(name) LIKE '%option%');

    -- Manual Overrides
    UPDATE products SET recipe_id = (SELECT id FROM recipes WHERE name = 'Nigerian Menu - Option A' LIMIT 1) WHERE organization_id = org_id AND (LOWER(name) LIKE '%nigerian%menu%option%a%' OR LOWER(name) LIKE '%option%a%');
    UPDATE products SET recipe_id = (SELECT id FROM recipes WHERE name = 'Jollof Rice' LIMIT 1) WHERE organization_id = org_id AND LOWER(name) LIKE '%jollof%' AND recipe_id IS NULL;
    UPDATE products SET recipe_id = (SELECT id FROM recipes WHERE name = 'Chinese Fried Rice' LIMIT 1) WHERE organization_id = org_id AND (LOWER(name) LIKE '%chinese%fried%rice%' OR LOWER(name) LIKE '%chinese%menu%') AND recipe_id IS NULL;
    
    RAISE NOTICE 'Imported 27 recipes with full scaling tiers';
END $$;
