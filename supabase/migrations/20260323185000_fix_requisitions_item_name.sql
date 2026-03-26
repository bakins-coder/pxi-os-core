-- Migration: Fix Requisitions Missing Columns
-- Description: Adds item_name and ensures other expected columns exist for sync.

ALTER TABLE public.requisitions 
ADD COLUMN IF NOT EXISTS item_name TEXT;

-- requestor_name might be missing if that migration was skipped
ALTER TABLE public.requisitions 
ADD COLUMN IF NOT EXISTS requestor_name TEXT;

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_requisitions_item_name ON public.requisitions(item_name);
