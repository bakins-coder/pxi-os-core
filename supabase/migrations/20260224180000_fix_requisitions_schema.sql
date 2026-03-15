
-- Fix Requisitions Table Schema
-- Adding missing columns to match SCHEMA_WHITELISTS and application expectations

ALTER TABLE public.requisitions 
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS ingredient_id uuid,
ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_per_unit_cents bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount_cents bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS requestor_id uuid,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS reference_id uuid,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS source_account_id uuid;

-- Enable RLS
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy Clean-up (Nuclear Style)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'requisitions'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.requisitions';
    END LOOP;
END $$;

-- JWT Helper check (assumed to exist from previous 20260224170000 migration)
-- Applying policy isolated by organization/company identity
CREATE POLICY "requisitions_manage_20260224" ON public.requisitions 
FOR ALL TO authenticated 
USING (company_id = get_jwt_organization_id())
WITH CHECK (company_id = get_jwt_organization_id());

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_requisitions_company_id ON public.requisitions(company_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_reference_id ON public.requisitions(reference_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_status ON public.requisitions(status);
