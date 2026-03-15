-- ====================================================================
-- MIGRATION: PURGE TEST DATA (Xquisite Workspace) - REFACTORED
-- ====================================================================
-- ORG ID: '10959119-72e4-4e57-ba54-923e36bba6a6'
-- ====================================================================

BEGIN;

DO $$ 
BEGIN
    -- 1. CLEAR TRANSACTIONAL HISTORY (CATERING & ORDERS)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'catering_events') THEN
        DELETE FROM public.catering_events WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dispatched_assets') THEN
        DELETE FROM public.dispatched_assets WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'logistics_returns') THEN
        DELETE FROM public.logistics_returns WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;

    -- 2. CLEAR FINANCIAL RECORDS
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
        DELETE FROM public.invoices WHERE company_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requisitions') THEN
        DELETE FROM public.requisitions WHERE company_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bookkeeping') THEN
        DELETE FROM public.bookkeeping WHERE company_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bank_transactions') THEN
        DELETE FROM public.bank_transactions WHERE company_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;

    -- 3. CLEAR INVENTORY MOVEMENT HISTORY
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ingredient_stock_batches') THEN
        DELETE FROM public.ingredient_stock_batches WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ingredient_movements') THEN
        DELETE FROM public.ingredient_movements WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stock_movements') THEN
        DELETE FROM public.stock_movements WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reusable_movements') THEN
        DELETE FROM public.reusable_movements WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rental_movements') THEN
        DELETE FROM public.rental_movements WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;

    -- 4. CLEAR CRM & COMMUNICATIONS
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'interaction_logs') THEN
        DELETE FROM public.interaction_logs WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
        DELETE FROM public.messages WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
        DELETE FROM public.tasks WHERE company_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
        DELETE FROM public.projects WHERE company_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;

    -- 5. CLEAR HR & PERFORMANCE HISTORY
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leave_requests') THEN
        DELETE FROM public.leave_requests WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'performance_reviews') THEN
        DELETE FROM public.performance_reviews WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'performance_logs') THEN
        DELETE FROM public.performance_logs WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;

    -- 6. SYSTEM LOGS
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agentic_logs') THEN
        DELETE FROM public.agentic_logs WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_logs') THEN
        DELETE FROM public.daily_logs WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;

    -- 7. RESET CONSUMABLE STOCK (BY DELETING HISTORY)
    -- NOTE: Ingredients and Products stock is primarily derived from batches and movements.
    -- Deleting from 'ingredient_stock_batches' and 'rental_stock' provides the clean slate.

    -- Clear Rental Stock (Consumables/Rentals - NOT Assets)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rental_stock') THEN
        DELETE FROM public.rental_stock WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;

    -- Legacy Inventory Reset (If exists and used for products/ingredients)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory') THEN
        UPDATE public.inventory SET stock_level = 0, stock_quantity = 0 
        WHERE company_id = '10959119-72e4-4e57-ba54-923e36bba6a6' 
          AND (is_asset = false OR is_asset IS NULL);
    END IF;

    -- Reset Bank Account Balances
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bank_accounts') THEN
        UPDATE public.bank_accounts SET balance_cents = 0 WHERE company_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
    END IF;

END $$;

COMMIT;
