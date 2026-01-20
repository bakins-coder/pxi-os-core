-- MIGRATION: 29 Fix RLS for Profiles and Organizations
-- Purpose: Allow users to read their own profile and organization data to escape the Setup Wizard loop.

BEGIN;

-- 1. Enable RLS on Profiles (ensure it's on)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts (safe refresh)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;

-- 3. Create Policy: Users can see their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 4. Create Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- 5. Create Policy: Users can see the organization they belong to
-- This is critical for the App to load the workspace details
CREATE POLICY "Users can view own organization"
ON public.organizations
FOR SELECT
USING (
    id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

COMMIT;

RAISE NOTICE 'RLS Policies fixed. Users should now be able to detect their workspace.';
