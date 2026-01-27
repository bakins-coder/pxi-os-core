
-- Migration to fix RLS policies and missing columns for the contacts table
-- Applied on 2026-01-27

-- 1. ADD MISSING COLUMNS
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company_id UUID; 

-- 2. ENABLE RLS
alter table public.contacts enable row level security;

-- Drop existing policies if any (safeguard)
drop policy if exists "Users can view their own company contacts" on public.contacts;
drop policy if exists "Users can insert their own company contacts" on public.contacts;
drop policy if exists "Users can update their own company contacts" on public.contacts;
drop policy if exists "Users can delete their own company contacts" on public.contacts;

-- Create Policies

-- SELECT
create policy "Users can view their own company contacts"
on public.contacts for select
using (
    company_id::text IN (
        select organization_id::text from public.profiles where id = auth.uid()
    )
);

-- INSERT
create policy "Users can insert their own company contacts"
on public.contacts for insert
with check (
    company_id::text IN (
        select organization_id::text from public.profiles where id = auth.uid()
    )
);

-- UPDATE
create policy "Users can update their own company contacts"
on public.contacts for update
using (
    company_id::text IN (
        select organization_id::text from public.profiles where id = auth.uid()
    )
);

-- DELETE
create policy "Users can delete their own company contacts"
on public.contacts for delete
using (
    company_id::text IN (
        select organization_id::text from public.profiles where id = auth.uid()
    )
);

-- Note: We also need a policy for authenticated users to create their FIRST contact if profiles is missing company_id?
-- No, normally profile is created during signup.
