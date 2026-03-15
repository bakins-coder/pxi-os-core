
-- Add requestor_name to requisitions table and whitelist
-- This ensures that the name of the person making the request is persisted 
-- even if their employee record changes or is deleted.

ALTER TABLE public.requisitions 
ADD COLUMN IF NOT EXISTS requestor_name text;

-- Update existing records if possible (best effort)
UPDATE public.requisitions r
SET requestor_name = e.first_name || ' ' || e.last_name
FROM public.employees e
WHERE r.requestor_id = e.id
AND r.requestor_name IS NULL;
