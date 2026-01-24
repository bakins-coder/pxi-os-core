-- DIAGNOSTIC: Check Organizations RLS
SELECT * FROM pg_policies WHERE tablename = 'organizations';

-- Check if current user (simulate akinbee) can read
DO $$
DECLARE
    v_count INT;
BEGIN
    -- This part is hard to simulate via script without exact auth context, 
    -- but we can check if there are restrictive policies.
    
    SELECT count(*) INTO v_count FROM public.organizations;
    RAISE NOTICE 'Total Organizations in DB (System View): %', v_count;
END $$;
