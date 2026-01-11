-- Seed Xquisite Asset Ledger
-- Generated based on user-provided inventory list images

WITH org AS (
  SELECT id FROM organizations LIMIT 1
)
INSERT INTO inventory (company_id, name, stock_quantity, category, is_asset, is_rental, price_cents, image)
SELECT 
  org.id,
  item.name,
  item.quantity,
  item.category,
  true,   -- is_asset
  false,  -- is_rental (Company owned)
  0,      -- price_cents (default)
  NULL    -- image (to be added)
FROM org, (VALUES
  -- Chargers
  ('White Chargers', 397, 'Chargers'),
  ('Black Chargers', 171, 'Chargers'),
  ('Silver Chargers', 174, 'Chargers'),
  ('Clear Gold Chargers', 86, 'Chargers'),
  ('Crystal Gold Chargers', 51, 'Chargers'),

  -- Plates & Bowls
  ('Round white plates', 182, 'Crockery'),
  ('Pattern white plates', 63, 'Crockery'),
  ('Deep black round plates', 59, 'Crockery'),
  ('Flat black round plates', 26, 'Crockery'),
  ('Chinese plates', 43, 'Crockery'),
  ('Ofada sauce bowls', 64, 'Crockery'),
  ('Efo bowls', 56, 'Crockery'),
  ('Black bowl for pepper soup', 88, 'Crockery'),
  ('Amala bowls', 66, 'Crockery'),
  ('Hot plates', 70, 'Crockery'),
  ('Chinese plates (Batch 2)', 43, 'Crockery'), -- Kept separate to match list
  ('Roasted potatoes & mushrooms plates', 63, 'Crockery'),
  ('Fettucine pasta plates', 50, 'Crockery'),
  ('White pepper soup bowl', 100, 'Crockery'),
  ('Side plates', 301, 'Crockery'),
  ('Saucers', 93, 'Crockery'),

  -- Glassware
  ('Plain water glasses', 264, 'Glassware'),
  ('Plain wine glasses', 187, 'Glassware'),
  ('Crystal water glasses', 165, 'Glassware'),
  ('Crystal Wine glasses', 167, 'Glassware'),

  -- Cutlery
  ('Silver Spoon', 141, 'Cutlery'),
  ('Silver Knife', 530, 'Cutlery'),
  ('Silver fork', 410, 'Cutlery'),
  ('Gold Spoon', 190, 'Cutlery'),
  ('Gold Fork', 557, 'Cutlery'),
  ('Gold Knife', 537, 'Cutlery'),
  ('Gold fork (new)', 97, 'Cutlery'),
  ('Gold Knife (new)', 101, 'Cutlery'),
  ('Tea Spoons', 32, 'Cutlery'),

  -- Tea Service
  ('Tea cups', 103, 'Crockery')

) AS item(name, quantity, category);
