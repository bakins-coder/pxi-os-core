-- Migration: CRM 360 Expansion
-- Adds interaction tracking and preference storage to contacts

BEGIN;

-- 1. Create Interaction Logs table
CREATE TABLE IF NOT EXISTS public.interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('Call', 'Email', 'Meeting', 'Note', 'Other')),
    summary TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Enable RLS for interaction_logs
ALTER TABLE public.interaction_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for interaction_logs
CREATE POLICY "Users can view their own company interaction logs"
ON public.interaction_logs FOR SELECT
USING (
    organization_id::text IN (
        SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own company interaction logs"
ON public.interaction_logs FOR INSERT
WITH CHECK (
    organization_id::text IN (
        SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
);

-- 2. Expand Contacts table
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS document_links JSONB DEFAULT '[]'::jsonb;

COMMIT;
