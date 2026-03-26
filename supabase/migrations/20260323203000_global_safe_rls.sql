
-- Migration: Global Safe RLS Repair (Robust)
-- Description: Fixes PostgREST crashes by using TEXT-based comparisons for RLS.
-- Includes existence checks for tables to prevent errors on missing relations.

-- 1. Ensure safe_uuid helper exists
CREATE OR REPLACE FUNCTION public.safe_uuid(text_id text) 
RETURNS uuid AS $$
BEGIN
  RETURN text_id::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Repair policies for all known affected tables
DO $$
DECLARE
    t text;
    tables_to_fix text[] := ARRAY[
        'ingredients', 'products', 'assets', 'reusable_items', 'rental_items', 
        'employees', 'catering_events', 'leave_requests', 'categories', 
        'rental_stock', 'ingredient_stock_batches', 'performance_reviews', 'leads',
        'invoices', 'contacts', 'projects', 'tasks', 'bank_transactions', 'chart_of_accounts',
        'messages', 'interaction_logs', 'entity_media', 'inventory', 'requisitions'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_fix LOOP
        -- CHECK IF TABLE EXISTS FIRST
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            -- DROP all common policy names to avoid duplicates or conflicts
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_manage_20260311', t);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_manage_ultimate', t);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_manage_standard', t);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_safe_v1', t);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_global_safe', t);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_global_safe_v2', t);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Tenant isolation', t);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Enable access for organization members', t);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Standard Org Access', t);
            
            -- Create safe policy using TEXT-based comparison
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'organization_id') THEN
                EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (
                    organization_id::text = ANY (ARRAY[
                        auth.jwt() -> ''user_metadata'' ->> ''company_id'',
                        auth.jwt() -> ''user_metadata'' ->> ''organization_id'',
                        auth.jwt() -> ''user_metadata'' ->> ''org_id''
                    ])
                )', t || '_global_safe_v3', t);
            ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'company_id') THEN
                EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (
                    company_id::text = ANY (ARRAY[
                        auth.jwt() -> ''user_metadata'' ->> ''company_id'',
                        auth.jwt() -> ''user_metadata'' ->> ''organization_id'',
                        auth.jwt() -> ''user_metadata'' ->> ''org_id''
                    ])
                )', t || '_global_safe_v3', t);
            END IF;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping...', t;
        END IF;
    END LOOP;
END
$$;

NOTIFY pgrst, 'reload config';
