-- Migration: RBAC Hardening & Schema Alignment
-- Date: 2026-04-12
-- Goal: Ensure interaction_logs and entity_media have company_id columns for AI query compatibility.

-- 1. Add company_id to interaction_logs
ALTER TABLE public.interaction_logs 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.organizations(id);

UPDATE public.interaction_logs 
SET company_id = organization_id
WHERE company_id IS NULL AND organization_id IS NOT NULL;

-- 2. Add company_id to entity_media
ALTER TABLE public.entity_media 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.organizations(id);

UPDATE public.entity_media 
SET company_id = organization_id
WHERE company_id IS NULL AND organization_id IS NOT NULL;

-- 3. Comments for clarity
COMMENT ON COLUMN public.interaction_logs.company_id IS 'Alias for organization_id for tool compatibility.';
COMMENT ON COLUMN public.entity_media.company_id IS 'Alias for organization_id for tool compatibility.';
