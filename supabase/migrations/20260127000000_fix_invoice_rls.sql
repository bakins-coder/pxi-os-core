
-- Enable RLS on invoices if not already enabled
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to INSERT invoices
CREATE POLICY "Enable insert for authenticated users" ON "public"."invoices"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to SELECT invoices
CREATE POLICY "Enable select for authenticated users" ON "public"."invoices"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to UPDATE invoices
CREATE POLICY "Enable update for authenticated users" ON "public"."invoices"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
