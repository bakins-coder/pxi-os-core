-- SECURITY POLICY FIX
-- Run this in Supabase SQL Editor to allow creating organizations and updating user profiles.

-- 1. Allow any authenticated user to create a NEW organization
CREATE POLICY "Enable insert for authenticated users" ON organizations
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. Allow users to manage their OWN profile (needed to link user to the new organization)
-- We use separate policies for Insert/Update to be safe, or ALL to cover upserts.
CREATE POLICY "Enable access to own user profile" ON users
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
