-- Migration: Add pack/unit metadata to requisitions
-- Purpose: Support decimal quantities and bulk/pack entry (bags, weights, etc.)

ALTER TABLE public.requisitions
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS pack_count INTEGER,
ADD COLUMN IF NOT EXISTS pack_size NUMERIC,
ADD COLUMN IF NOT EXISTS pack_type TEXT;

COMMENT ON COLUMN public.requisitions.unit IS 'Unit of measure (kg, g, L, ml, pcs, pack, tin, bags)';
COMMENT ON COLUMN public.requisitions.pack_count IS 'Number of packs/bags purchased';
COMMENT ON COLUMN public.requisitions.pack_size IS 'Size of each pack/bag in the given unit';
COMMENT ON COLUMN public.requisitions.pack_type IS 'Type of packaging (Bags, Packs, Cartons, Gallons, Pieces)';
