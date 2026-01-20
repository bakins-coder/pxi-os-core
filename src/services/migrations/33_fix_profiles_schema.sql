-- MIGRATION: Fix Profiles Schema
-- Purpose: Ensure 'email' and other critical columns exist on public.profiles.
-- Context: It seems the table existed prior to Migration 06 without these columns, causing triggers to fail.

DO $$
BEGIN
    -- 1. Add 'email' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
        RAISE NOTICE 'Added email column to profiles.';
    END IF;

    -- 2. Add 'role' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT;
        RAISE NOTICE 'Added role column to profiles.';
    END IF;

    -- 3. Add 'first_name' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'first_name') THEN
        ALTER TABLE public.profiles ADD COLUMN first_name TEXT;
        RAISE NOTICE 'Added first_name column to profiles.';
    END IF;

    -- 4. Add 'last_name' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_name') THEN
        ALTER TABLE public.profiles ADD COLUMN last_name TEXT;
        RAISE NOTICE 'Added last_name column to profiles.';
    END IF;

    -- 5. Add 'avatar_url' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to profiles.';
    END IF;

END $$;
