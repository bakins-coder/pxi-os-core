-- MIGRATION: SEED DATA
-- This script populates the tables with the "previously captured" data.

-- A. Seed Asset Ledger (Inventory)
WITH org AS (
  SELECT id FROM organizations WHERE name LIKE 'Xquisite%' LIMIT 1
)
INSERT INTO inventory (company_id, name, stock_quantity, category, is_asset, is_rental, price_cents)
SELECT 
  org.id, item.name, item.quantity, item.category, true, false, 0
FROM org, (VALUES
  ('White Chargers', 397, 'Chargers'),
  ('Black Chargers', 171, 'Chargers'),
  ('Silver Chargers', 174, 'Chargers'),
  ('Clear Gold Chargers', 86, 'Chargers'),
  ('Crystal Gold Chargers', 51, 'Chargers'),
  ('Round white plates', 182, 'Crockery'),
  ('Pattern white plates', 63, 'Crockery'),
  ('Deep black round plates', 59, 'Crockery'),
  ('Flat black round plates', 26, 'Crockery'),
  ('Chinese plates', 43, 'Crockery'),
  ('Ofada sauce bowls', 64, 'Crockery'),
  ('Efo bowls', 56, 'Crockery'),
  ('Plain water glasses', 264, 'Glassware'),
  ('Plain wine glasses', 187, 'Glassware'),
  ('Crystal water glasses', 165, 'Glassware'),
  ('Crystal Wine glasses', 167, 'Glassware'),
  ('Silver Spoon', 141, 'Cutlery'),
  ('Silver Knife', 530, 'Cutlery'),
  ('Silver fork', 410, 'Cutlery'),
  ('Gold Spoon', 190, 'Cutlery'),
  ('Gold Fork', 557, 'Cutlery'),
  ('Gold Knife', 537, 'Cutlery')
) AS item(name, quantity, category)
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE name = item.name AND company_id = org.id);


-- B. Seed Employees (Based on known users)
WITH org AS (
  SELECT id FROM organizations WHERE name LIKE 'Xquisite%' LIMIT 1
)
INSERT INTO employees (company_id, name, role, email, status, avatar)
SELECT 
  org.id, u.name, 'Admin', u.email, 'Active', u.avatar
FROM org, (VALUES
  ('Xquisite Admin', 'toxsyyb@yahoo.co.uk', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Xquisite'),
  ('Ore Braithwaite', 'oreoluwatomiwab@gmail.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=OreBraithwaite'),
  ('Tomiwa B', 'tomiwab@hotmail.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tomiwa')
) AS u(name, email, avatar)
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = u.email AND company_id = org.id);


-- C. Seed Chart of Accounts (Core Ledger Headers)
WITH org AS (
  SELECT id FROM organizations WHERE name LIKE 'Xquisite%' LIMIT 1
)
INSERT INTO chart_of_accounts (company_id, code, name, type, subtype, balance_cents)
SELECT 
  org.id, acc.code, acc.name, acc.type, acc.subtype, acc.balance
FROM org, (VALUES
    ('1001', 'Cash on Hand', 'Asset', 'Current', 0),
    ('1002', 'Petty Cash', 'Asset', 'Current', 0),
    ('1003', 'GTBank Corporate', 'Asset', 'Current', 0),
    ('1004', 'Zenith Bank Operations', 'Asset', 'Current', 0),
    ('1501', 'Vehicles', 'Asset', 'Fixed', 0),
    ('1502', 'Furniture & Fittings', 'Asset', 'Fixed', 0),
    ('1503', 'Kitchen Equipment', 'Asset', 'Fixed', 0),
    ('3001', 'Share Capital', 'Equity', 'Equity', 0),
    ('4001', 'Catering Sales', 'Revenue', 'Operating', 0),
    ('5001', 'Cost of Goods Sold', 'Expense', 'COGS', 0),
    ('5002', 'Salaries & Wages', 'Expense', 'Operating', 0)
) AS acc(code, name, type, subtype, balance)
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE code = acc.code AND company_id = org.id);
