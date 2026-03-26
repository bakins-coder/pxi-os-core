
-- Migration: Complete Invoice Schema Repair
-- Description: Adds all missing columns to the invoices table required by the frontend sync engine.

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS subtotal_cents BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_charge_cents BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_cents BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS manual_set_price_cents BIGINT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_cents BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS standard_total_cents BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS lines JSONB DEFAULT '[]'::jsonb;

-- Ensure RLS is still enabled and working
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Reload PostgREST to pick up new columns
NOTIFY pgrst, 'reload config';
