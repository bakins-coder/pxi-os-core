-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Product Categories: Public Read (Authenticated)
DROP POLICY IF EXISTS "Authenticated users can select product categories" ON product_categories;
CREATE POLICY "Authenticated users can select product categories" 
ON product_categories FOR SELECT 
TO authenticated 
USING (true);

-- Products: Organization Isolation
DROP POLICY IF EXISTS "Users can view own organization products" ON products;
CREATE POLICY "Users can view own organization products" 
ON products FOR SELECT 
TO authenticated 
USING (
    organization_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
    OR
    organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
    OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.organization_id = products.organization_id
    )
);

-- Allow Insert/Update for authenticated users (simplified for now)
DROP POLICY IF EXISTS "Users can insert own organization products" ON products;
CREATE POLICY "Users can insert own organization products" 
ON products FOR INSERT 
TO authenticated 
WITH CHECK (
    organization_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
);
