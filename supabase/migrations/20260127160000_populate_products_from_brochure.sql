-- Migration: Populate Products with Category IDs from Xquisite Brochure
-- Generated: 2026-01-27
-- This script updates existing products or inserts new ones with proper category_id links

-- Step 1: Get category IDs into variables (PostgreSQL)
DO $$
DECLARE
    cat_hors_doeuvre UUID;
    cat_starters UUID;
    cat_salads UUID;
    cat_nigerian UUID;
    cat_oriental UUID;
    cat_continental UUID;
    cat_hot_plates UUID;
    cat_dessert UUID;
BEGIN
    -- Fetch category IDs
    SELECT id INTO cat_hors_doeuvre FROM categories WHERE name = 'Hors D''Oeuvre' LIMIT 1;
    SELECT id INTO cat_starters FROM categories WHERE name = 'Starters' LIMIT 1;
    SELECT id INTO cat_salads FROM categories WHERE name = 'Salads' LIMIT 1;
    SELECT id INTO cat_nigerian FROM categories WHERE name = 'Nigerian Cuisine' LIMIT 1;
    SELECT id INTO cat_oriental FROM categories WHERE name = 'Oriental' LIMIT 1;
    SELECT id INTO cat_continental FROM categories WHERE name = 'Continental' LIMIT 1;
    SELECT id INTO cat_hot_plates FROM categories WHERE name = 'Hot Plates' LIMIT 1;
    SELECT id INTO cat_dessert FROM categories WHERE name = 'Dessert' LIMIT 1;

    -- =============================================
    -- HORS D'OEUVRE (₦4,500 - ₦6,500 per head)
    -- =============================================
    INSERT INTO products (id, name, description, price_cents, category_id, organization_id)
    VALUES
        (gen_random_uuid(), 'Spanish Ham Platter', 'Spanish ham with olives & oranges on toast bread, smoked salmon on a bed of cucumber cup, tuna laced with peppers topping on garlic bread, prawn cucumber cups', 450000, cat_hors_doeuvre, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Shrimp Cocktail', 'Classic shrimp cocktail served chilled', 500000, cat_hors_doeuvre, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Wrapped Noodle Prawn', 'Prawns wrapped in crispy noodles', 550000, cat_hors_doeuvre, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Mixed Appetizers Platter', 'Meat balls, mixed seafood balls, mixed kebab', 250000, cat_hors_doeuvre, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Party Finger Foods', 'Barbecue chicken wings, chicken, money bags, samosa, prawn roll, chicken spring rolls, vegetable spring rolls', 650000, cat_hors_doeuvre, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Snails', 'Grilled snails in special sauce', 600000, cat_hors_doeuvre, (SELECT id FROM organizations LIMIT 1))
    ON CONFLICT (id) DO NOTHING;

    -- =============================================
    -- STARTERS (₦4,500 - ₦9,500)
    -- =============================================
    INSERT INTO products (id, name, description, price_cents, category_id, organization_id)
    VALUES
        (gen_random_uuid(), 'Goat Meat Pepper Soup', 'Traditional Nigerian pepper soup with goat meat', 700000, cat_starters, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Fish Pepper Soup', 'Spicy pepper soup with fresh fish', 700000, cat_starters, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Chicken Pepper Soup', 'Aromatic pepper soup with tender chicken', 600000, cat_starters, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Chicken Corn Soup', 'Creamy chicken and corn soup', 550000, cat_starters, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Vegetable Soup', 'Fresh mixed vegetable soup', 450000, cat_starters, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Beef and Noodles Soup', 'Hearty beef soup with noodles', 650000, cat_starters, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Oriental Shrimps and Noodle Soup', 'Asian-style shrimp noodle soup', 800000, cat_starters, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Cream of Mushroom Soup', 'Classic creamy mushroom soup', 600000, cat_starters, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Spicy Thai Shrimps Soup', 'Thai-inspired spicy shrimp soup', 850000, cat_starters, (SELECT id FROM organizations LIMIT 1))
    ON CONFLICT (id) DO NOTHING;

    -- =============================================
    -- SALADS (₦4,500 - ₦9,500)
    -- =============================================
    INSERT INTO products (id, name, description, price_cents, category_id, organization_id)
    VALUES
        (gen_random_uuid(), 'Coleslaw', 'Classic cabbage coleslaw', 450000, cat_salads, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Vegetable Salad', 'Fresh mixed garden vegetables', 500000, cat_salads, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Tossed Vegetable Salad', 'Lightly tossed fresh vegetables', 550000, cat_salads, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Prawns and Calamari Salad', 'Seafood salad with prawns and calamari', 950000, cat_salads, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Caesar Salad', 'Classic Caesar with croutons and parmesan', 600000, cat_salads, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Chicken Salad', 'Fresh salad topped with grilled chicken', 650000, cat_salads, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Avocado Salad', 'Creamy avocado salad', 700000, cat_salads, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Potato Salad', 'Classic potato salad', 500000, cat_salads, (SELECT id FROM organizations LIMIT 1))
    ON CONFLICT (id) DO NOTHING;

    -- =============================================
    -- NIGERIAN CUISINE (₦10,500 - ₦11,500 per head)
    -- =============================================
    INSERT INTO products (id, name, description, price_cents, category_id, organization_id)
    VALUES
        (gen_random_uuid(), 'Nigerian Option A - Jollof Rice Combo', 'Xquisite jollof rice & Xquisite Special Fried Rice served with Chicken in Peppered Sauce & Stewed Beef, Coleslaw, Moi-moi or Fried plantain', 1050000, cat_nigerian, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Nigerian Option B - Efo Riro', 'Richly Prepared Efo-Riro/Efo-Elegusi served with Poundo Yam & Fresh Fish', 1050000, cat_nigerian, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Nigerian Option C - Ofada Rice', 'Locally Grown Ofada Rice served with Designer Stew, Fried Fish & Fried Plantain or Moi-moi', 1050000, cat_nigerian, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Nigerian Option D - Yam Pottage', 'Yam pottage with palm fried fish dry fish sauce, Fried fish & fried plantain OR Ewa agoyin topped with palm fried dry fish sauce, fried fish & fried plantain', 1050000, cat_nigerian, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Nigerian Option E - Amala', 'Amala served with gbegiri, ewedu and assorted meat stew laced with panla & Fresh Fish', 1050000, cat_nigerian, (SELECT id FROM organizations LIMIT 1))
    ON CONFLICT (id) DO NOTHING;

    -- =============================================
    -- ORIENTAL - CHINESE (₦12,500 per head)
    -- =============================================
    INSERT INTO products (id, name, description, price_cents, category_id, organization_id)
    VALUES
        (gen_random_uuid(), 'Chinese Fried Rice', 'Chinese fried rice with prawns, lamb fillet, chicken & vegetables', 1250000, cat_oriental, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Stir Fry Noodles', 'Stir fry noodles with vegetable and chicken fillet', 1250000, cat_oriental, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Braised Lamb in Oyster Sauce', 'Tender lamb braised in rich oyster sauce', 1250000, cat_oriental, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Shredded Spicy Beef', 'Shredded spicy beef in green peppers', 1250000, cat_oriental, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Prawns in Coconut Sauce', 'Succulent prawns in creamy coconut sauce', 1250000, cat_oriental, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Stir Fry Prawns with Peppers', 'Wok-fried prawns with mixed peppers', 1250000, cat_oriental, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Crispy Fish in Sweet Oriental Sauce', 'Fillet fish in crispy batter served with a sweet oriental sauce', 1250000, cat_oriental, (SELECT id FROM organizations LIMIT 1))
    ON CONFLICT (id) DO NOTHING;

    -- =============================================
    -- ORIENTAL - THAI (₦12,500 per head)
    -- =============================================
    INSERT INTO products (id, name, description, price_cents, category_id, organization_id)
    VALUES
        (gen_random_uuid(), 'Thai Sticky Rice with Spare Ribs', 'Sticky rice served with sticky spicy goat spare ribs', 1250000, cat_oriental, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Thai Chicken Curry', 'Thai chicken curry/Thai chicken with cashew nuts and mixed peppers served with steamed basmati and vegetables', 1250000, cat_oriental, (SELECT id FROM organizations LIMIT 1))
    ON CONFLICT (id) DO NOTHING;

    -- =============================================
    -- CONTINENTAL (₦12,500 - ₦50,000)
    -- =============================================
    INSERT INTO products (id, name, description, price_cents, category_id, organization_id)
    VALUES
        (gen_random_uuid(), 'Grilled Spicy Prawns with Fettuccine', 'Grilled spicy prawns served with fettuccine pasta wrapped in a creamy basil cheese sauce/tomato sauce (jumbo prawns ₦20,000)', 1850000, cat_continental, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Chicken in Mushroom Sauce', 'Chicken in mushroom sauce served with roast potatoes and steamed vegetables', 1250000, cat_continental, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Slow Roasted Nigerian Lamb Steak', 'Slow roasted Nigerian lamb steak in a brown and mint sauce served with grilled jumbo prawns, sauteed potatoes/special fried rice with vegetables in season (Imported lamb option ₦25,000)', 1800000, cat_continental, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Braised Oxtail/Lamb Chops', 'Braised and succulent tenderized imported oxtail/lamb chops in xquisite special brown sauce served with roast potatoes in parsley, baby carrots, broccoli and shallots', 3500000, cat_continental, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Grilled Salmon Steak', 'Grilled salmon steak in a creamy garlic white sauce served with Xquisite special fried rice/mashed potatoes, asparagus and baby carrots with cherry tomatoes', 5000000, cat_continental, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Fish, Prawns and Calamari in Batter', 'Fish, prawns and calamari in batter served with onion rings, french fries, tartar sauce and coleslaw', 1850000, cat_continental, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Succulent Lamb in Oyster Sauce', 'Succulent lamb in oyster sauce, stir fried prawns served with potato gratin topped with parsley (with jumbo prawns ₦35,000)', 2200000, cat_continental, (SELECT id FROM organizations LIMIT 1))
    ON CONFLICT (id) DO NOTHING;

    -- =============================================
    -- HOT PLATES (₦16,000 - ₦55,000)
    -- =============================================
    INSERT INTO products (id, name, description, price_cents, category_id, organization_id)
    VALUES
        (gen_random_uuid(), 'Premium Hot Plate - Prawn & Imported Steak', 'Prawn & Imported steak in a hot plate served with Xquisite special fried rice, sauteed potatoes and steamed vegetables', 5500000, cat_hot_plates, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Hot Plate - Prawn & Grilled Chicken', 'Prawn & grilled chicken hot plate served with xquisite special fried rice, sauteed potatoes and steamed vegetables', 2200000, cat_hot_plates, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Hot Plate - Prawn', 'Prawn hot plate served with xquisite special fried rice, sauteed potatoes and steamed vegetables', 2000000, cat_hot_plates, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Hot Plate - Succulent Nigerian Lamb', 'Succulent Nigerian Lamb hot plate served with xquisite special fried rice, sauteed potatoes and steamed vegetables', 1600000, cat_hot_plates, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Hot Plate - Imported Succulent Lamb', 'Imported succulent lamb served with potato gratin and steamed vegetables', 3500000, cat_hot_plates, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Hot Plate - Sweet and Sour Prawns', 'Sizzling sweet and sour prawns in peppers served with steamed basmati rice', 2000000, cat_hot_plates, (SELECT id FROM organizations LIMIT 1))
    ON CONFLICT (id) DO NOTHING;

    -- =============================================
    -- DESSERT (₦4,500 - ₦25,000)
    -- =============================================
    INSERT INTO products (id, name, description, price_cents, category_id, organization_id)
    VALUES
        (gen_random_uuid(), 'Apple Pie', 'Apple pie served with homemade custard or ice cream', 650000, cat_dessert, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Apple & Blackberry Crumble', 'Apple & blackberry crumble served with homemade custard or ice cream', 850000, cat_dessert, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Apple Crumble', 'Apple crumble served with homemade custard or ice cream (IMPORTED APPLES AT EXTRA COST)', 550000, cat_dessert, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Apple Crumble (Imported)', 'Apple crumble with imported apples', 450000, cat_dessert, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Exotic Fruit Salad', 'Fresh exotic fruit salad', 850000, cat_dessert, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Fruit Trifle', 'Layered fruit trifle dessert', 1050000, cat_dessert, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Pancakes or Waffles', 'Pancakes or waffles served with strawberries or syrup', 550000, cat_dessert, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Pineapple Upside Down', 'Classic pineapple upside down cake', 650000, cat_dessert, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Chocolate Roulade', 'Rich chocolate roulade', 650000, cat_dessert, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Chocolate Orange Mousse', 'Chocolate orange served with chocolate mousse', 950000, cat_dessert, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Cream Caramel', 'Classic cream caramel', 650000, cat_dessert, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Black Forest Gateau', 'Traditional Black Forest gateau', 850000, cat_dessert, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Apricot Gateau', 'Apricot flavored gateau', 950000, cat_dessert, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Lemon Cheesecake with Blackberries', 'Creamy lemon cheesecake topped with blackberries', 2500000, cat_dessert, (SELECT id FROM organizations LIMIT 1)),
        (gen_random_uuid(), 'Strawberry Gateau', 'Fresh strawberry gateau', 2500000, cat_dessert, (SELECT id FROM organizations LIMIT 1))
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Successfully populated products with category IDs';
END $$;
