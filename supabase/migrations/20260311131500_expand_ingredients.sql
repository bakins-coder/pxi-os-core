-- MIGRATION: EXPAND INGREDIENTS TABLE
-- Adding fields to ensure persistence of stock levels, costs, and richer packaging metadata

ALTER TABLE public.ingredients 
ADD COLUMN IF NOT EXISTS unit text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS stock_level numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_cost_cents bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_pack_type text;

-- Optional: Indexing for performance
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON public.ingredients(category);
