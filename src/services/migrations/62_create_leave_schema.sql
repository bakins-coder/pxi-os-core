-- CREATE LEAVE REQUESTS TABLE (Schema Only)
-- Reason: Creating the missing infrastructure without generating test data.

-- 1. Create Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- Annual, Sick, etc.
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
    applied_date TIMESTAMPTZ DEFAULT NOW(),
    approved_by UUID REFERENCES public.employees(id),
    calendar_synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Policy: View Own or Admin/CEO/HR/Manager
DROP POLICY IF EXISTS "View Requests" ON public.leave_requests;
CREATE POLICY "View Requests" ON public.leave_requests
    FOR SELECT
    USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('Admin', 'Super Admin', 'HR Manager', 'CEO', 'Chief Executive Officer', 'Manager'))
        OR
        employee_id IN (SELECT id FROM public.employees WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    );

-- Policy: Insert Own
DROP POLICY IF EXISTS "Insert Requests" ON public.leave_requests;
CREATE POLICY "Insert Requests" ON public.leave_requests
    FOR INSERT
    WITH CHECK (
        employee_id IN (SELECT id FROM public.employees WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    );

-- Policy: Update (Approve/Reject) - Admins Only
DROP POLICY IF EXISTS "Update Requests" ON public.leave_requests;
CREATE POLICY "Update Requests" ON public.leave_requests
    FOR UPDATE
    USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('Admin', 'Super Admin', 'HR Manager', 'CEO', 'Chief Executive Officer', 'Manager'))
    );

SELECT 'Table Created Successfully' as status;
