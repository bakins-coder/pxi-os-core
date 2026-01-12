
-- Migration: Seed Brochure Menu Items
-- Description: Populates the inventory table with high-end catering menu items from the Xquisite Brochure.
-- Categories: Hors D'Oeuvre, Starters, Salads, Nigerian, Oriental, Continental, Hot Plates, Dessert.

-----------------------------------------------------------
-- 1. Helper Function to Generate IDs (if not using uuid_generate_v4 directly in values)
-- We will use the default uuid generation from the table definition.
-----------------------------------------------------------

-- CLEANUP: Optional - Remove generic sample data if it exists (safe to run)
DELETE FROM inventory 
WHERE type = 'product' 
  AND (name ILIKE '%Sample%' OR name = 'Jollof Rice' OR name = 'Fried Rice') 
  AND company_id = (SELECT id FROM companies LIMIT 1);

-----------------------------------------------------------
-- 2. Insert Menu Items
-----------------------------------------------------------

INSERT INTO inventory (company_id, name, category, type, description, price_cents, stock_quantity, created_at, updated_at)
SELECT 
    (SELECT id FROM companies LIMIT 1), -- Assumes single tenant for now
    m.name,
    m.category,
    'product'::inventory_type,
    m.description,
    m.price_cents,
    100000, -- Default unlimited stock for menu items
    NOW(),
    NOW()
FROM (VALUES
    -- HORS D'OEUVRE
    ('Spanish Ham & Smoked Salmon Platter', 'Hors D''Oeuvre', 'Spanish ham with olives & oranges on toast bread, smoked salmon on a bed of cucumber cup, tuna laced with peppers topping on garlic bread, prawn cucumber cups', 450000),
    ('Shrimp Cocktail', 'Hors D''Oeuvre', 'Classic shrimp cocktail', 500000),
    ('Wrapped Noodle Prawn', 'Hors D''Oeuvre', 'Crispy wrapped noodle prawn', 550000),
    ('Mixed Grill Platter', 'Hors D''Oeuvre', 'Meat balls, Mixed seafood balls, Mixed kebab', 250000),
    ('Asian Fusion Platter', 'Hors D''Oeuvre', 'Barbecue chicken wings, chicken, Money bags, samosa, Prawn roll, chicken spring rolls, vegetable spring rolls', 650000),
    ('Peppered Snails', 'Hors D''Oeuvre', 'Spicy peppered snails', 600000),

    -- STARTER (SOUPS)
    ('Goat Meat Pepper Soup', 'Starters', 'Spicy traditional goat meat soup', 500000), -- Estimating avg price based on range 4500-9500
    ('Fish Pepper Soup', 'Starters', 'Fresh fish spicy soup', 500000),
    ('Chicken Pepper Soup', 'Starters', 'Spicy chicken soup', 450000),
    ('Chicken Corn Soup', 'Starters', 'Creamy chicken and corn soup', 550000),
    ('Vegetable Soup', 'Starters', 'Mixed vegetable soup', 450000),
    ('Beef and Noodles Soup', 'Starters', 'Hearty beef and noodle broth', 550000),
    ('Oriental Shrimps and Noodle Soup', 'Starters', 'Asian style shrimp and noodle soup', 650000),
    ('Cream of Mushroom Soup', 'Starters', 'Rich creamy mushroom soup', 550000),
    ('Spicy Thai Shrimps'' Soup', 'Starters', 'Hot and sour Thai shrimp soup', 700000),

    -- SALADS
    ('Coleslaw', 'Salads', 'Creamy cabbage and carrot salad', 450000),
    ('Vegetable Salad', 'Salads', 'Fresh garden salad', 450000),
    ('Tossed Vegetable Salad', 'Salads', 'Mixed tossed greens', 450000),
    ('Prawns and Calamari Salad', 'Salads', 'Seafood salad with prawns and calamari', 850000),
    ('Caesar Salad', 'Salads', 'Classic Caesar with croutons and parmesan', 600000),
    ('Chicken Salad', 'Salads', 'Grilled chicken breast salad', 650000),
    ('Avocado Salad', 'Salads', 'Fresh avocado mix', 550000),
    ('Potato Salad', 'Salads', 'Classic creamy potato salad', 500000),

    -- NIGERIAN CUISINE (Options)
    ('Nigerian Menu - Option A', 'Nigerian Cuisine', 'Xquisite jollof rice & Xquisite Special Fried Rice Served with Chicken in Peppered Sauce & Stewed Beef, Coleslaw, Moi-moi or Fried plantain', 1050000),
    ('Nigerian Menu - Option B', 'Nigerian Cuisine', 'Richly Prepared Efo-Riro / Efo-Elegusi Served with Poundo Yam & Fresh Fish', 1050000),
    ('Nigerian Menu - Option C', 'Nigerian Cuisine', 'Locally Grown Ofada Rice Served with Designer Stew, Fried Fish & Fried Plantain or Moi-moi', 1050000),
    ('Nigerian Menu - Option D', 'Nigerian Cuisine', 'Yam pottage with palm fried fish dry fish sauce, Fried fish & fried plantain OR Ewa agoyin topped with palm fried dry fish sauce, fried fish & fried plantain', 1050000),
    ('Nigerian Menu - Option E', 'Nigerian Cuisine', 'Amala served with gbegiri, ewedu and assorted meat stew laced with panla & Fresh Fish', 1050000),

    -- ORIENTAL (Packages & Items)
    ('Chinese Menu Package', 'Oriental', 'Includes Chinese dishes and choice of sauces. (N12,500 Per Head)', 1250000),
    ('Chinese Fried Rice', 'Oriental', 'With prawns, lamb fillet, chicken & vegetables (Select with Package)', 0),
    ('Stir Fry Noodles', 'Oriental', 'With vegetable and chicken fillet (Select with Package)', 0),
    ('Braised Lamb in Oyster Sauce', 'Oriental', 'Sauce Option (Select with Package)', 0),
    ('Shredded Spicy Beef', 'Oriental', 'In green peppers (Select with Package)', 0),
    ('Prawns in Coconut Sauce', 'Oriental', 'Sauce Option (Select with Package)', 0),
    ('Stir Fry Prawns with Peppers', 'Oriental', 'Sauce Option (Select with Package)', 0),
    ('Fillet Fish in Crispy Batter', 'Oriental', 'Served with sweet oriental sauce (Select with Package)', 0),

    -- THAI
    ('Thai Menu Package', 'Oriental', 'Choice of Sticky Rice or Curry dishes. (N12,500 Per Head)', 1250000),
    ('Sticky Rice with Goat Ribs', 'Oriental', 'Sticky rice served with sticky spicy goat spare ribs', 1250000), -- Alternative standalone price
    ('Thai Chicken Curry', 'Oriental', 'Thai chicken with cashew nuts and mixed peppers served with steamed basmati and vegetables', 1250000),

    -- CONTINENTAL
    ('Grilled Spicy Prawns', 'Continental', 'Served with fettuccine pasta wrapped in a creamy basil cheese sauce/tomato sauce', 1850000),
    ('Grilled Jumbo Prawns Upgrade', 'Continental', 'Upgrade for Spicy Prawns (N20,000)', 2000000),
    ('Chicken in Mushroom Sauce', 'Continental', 'Served with roast potatoes and steamed vegetables', 1250000),
    ('Slow Roasted Nigerian Lamb Steak', 'Continental', 'In brown and mint sauce served with grilled jumbo prawns, sautéed potatoes/special fried rice', 1800000),
    ('Imported Lamb Steak Option', 'Continental', 'Imported lamb option', 2500000),
    ('Braised Oxtail/Lamb Chops', 'Continental', 'Imported oxtail/lamb chops in brown sauce served with roast potatoes, parsley, baby carrots, broccoli', 3500000),
    ('Grilled Salmon Steak', 'Continental', 'In creamy garlic white sauce served with fried rice/mashed potatoes, asparagus', 5000000),
    ('Fish, Prawns and Calamari in Batter', 'Continental', 'Served with onion rings, french fries, tartar sauce and coleslaw', 1850000),
    ('Succulent Lamb in Oyster Sauce', 'Continental', 'Served with potato gratin topped with parsley', 2200000),
    ('Lamb with Jumbo Prawns', 'Continental', 'Succulent lamb with jumbo prawns', 3500000),

    -- HOT PLATES
    ('Prawn & Imported Steak Hot Plate', 'Hot Plates', 'Served with Xquisite special fried rice, sautéed potatoes and steamed vegetables', 5500000),
    ('Prawn & Grilled Chicken Hot Plate', 'Hot Plates', 'Served with xquisite special fried rice, sautéed potatoes and steamed vegetables', 2200000),
    ('Prawn Hot Plate', 'Hot Plates', 'Served with xquisite special fried rice, sautéed potatoes and steamed vegetables', 2000000),
    ('Succulent Nigerian Lamb Hot Plate', 'Hot Plates', 'Served with xquisite special fried rice, sautéed potatoes and steamed vegetables', 1600000),
    ('Imported Succulent Lamb Hot Plate', 'Hot Plates', 'Served with potato gratin and steamed vegetables', 3500000),
    ('Sizzling Sweet and Sour Prawns', 'Hot Plates', 'Served with steamed basmati rice', 2000000),

    -- DESSERT
    ('Apple Pie', 'Dessert', 'Served with homemade custard or ice cream', 650000),
    ('Apple & Blackberry Crumble', 'Dessert', 'Served with homemade custard or ice cream', 850000),
    ('Apple Crumble', 'Dessert', 'Served with homemade custard or ice cream', 550000), -- Taking the N5500 price
    ('Use Imported Apples (Extra)', 'Dessert', 'Surcharge for imported apples', 150000), -- Estimated surcharge or line item
    ('Exotic Fruit Salad', 'Dessert', 'Fresh exotic fruits', 850000),
    ('Fruit Trifle', 'Dessert', 'Classic fruit trifle', 1050000),
    ('Pancakes or Waffles', 'Dessert', 'Served with strawberries or syrup', 550000),
    ('Pineapple Upside Down', 'Dessert', 'Classic cake', 650000),
    ('Chocolate Roulade', 'Dessert', 'Rich chocolate roll', 650000),
    ('Chocolate Orange with Mousse', 'Dessert', 'Served with chocolate mousse', 950000),
    ('Cream Caramel', 'Dessert', 'Classic creme caramel', 650000),
    ('Black Forest Gateau', 'Dessert', 'Rich cherry chocolate cake', 850000),
    ('Apricot Gateau', 'Dessert', 'Fruity cake', 950000),
    ('Lemon Cheesecake', 'Dessert', 'With blackberries', 2500000),
    ('Strawberry Gateau', 'Dessert', 'Fresh strawberry cake', 2500000)

) AS m(name, category, description, price_cents)
ON CONFLICT (name, company_id) DO UPDATE SET
    price_cents = EXCLUDED.price_cents,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    type = 'product',
    updated_at = NOW();
