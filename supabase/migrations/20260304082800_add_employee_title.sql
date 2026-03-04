-- Migration to add 'title' column to employees table for staff profile display
ALTER TABLE IF EXISTS public.employees
ADD COLUMN IF NOT EXISTS title text;
