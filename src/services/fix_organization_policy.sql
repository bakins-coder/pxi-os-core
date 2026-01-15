-- SQL Fix for "RLS Violation" on Organization Setup
-- Run this script in the Supabase SQL Editor.

-- 1. Add 'created_by' column to organizations if it doesn't exist
-- This allows us to track who owns the organization immediately upon creation.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'created_by') THEN
        ALTER TABLE organizations ADD COLUMN created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2. Enable RLS (Ensure it's active)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 3. Allow Authenticated Users to INSERT a new Organization
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
CREATE POLICY "Authenticated users can create organizations" 
ON organizations 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 4. Allow Creators to VIEW their own Organizations (Crucial for the RETURNING clause)
DROP POLICY IF EXISTS "Creators can view their organizations" ON organizations;
CREATE POLICY "Creators can view their organizations" 
ON organizations 
FOR SELECT 
USING (auth.uid() = created_by);

-- 5. Existing policy "Users can see their own organization" (based on company_id in metadata) 
-- remains valid for when the user's metadata is eventually updated.
