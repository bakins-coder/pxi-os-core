-- PERFORMANCE REVIEWS TABLE
-- Stores appraisal cycles, self-assessments, and manager reviews.

CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    
    year INTEGER NOT NULL,
    quarter TEXT NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    
    -- Metrics stored as JSON array of objects:
    -- [{ "category": "Core Values", "metric": "Ownership", "self_score": 4, "manager_score": 5, "comment": "..." }]
    metrics JSONB DEFAULT '[]'::jsonb,
    
    total_score NUMERIC(5, 2) DEFAULT 0, -- e.g. 85.50
    
    -- Status Workflow: 
    -- 1. Draft (Admin created cycle)
    -- 2. Employee_Review (Employee filling self-assessment)
    -- 3. Supervisor_Review (Manager grading)
    -- 4. Finalized (Completed)
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Employee_Review', 'Supervisor_Review', 'Finalized')),
    
    start_date TIMESTAMPTZ DEFAULT NOW(),
    submitted_date TIMESTAMPTZ,
    finalized_date TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- 1. View: 
-- Employees can view their own reviews.
-- Admins and Managers can view ALL (for their org).
CREATE POLICY "Employees view own reviews" ON public.performance_reviews
    FOR SELECT
    USING (auth.uid() = employee_id);

CREATE POLICY "Admins/Managers view all reviews" ON public.performance_reviews
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role IN ('Admin', 'Manager', 'Logistics Manager', 'Super Admin') -- Add more roles if needed
        )
    );

-- 2. Insert:
-- Only Admins (HR) can create a Review Cycle (Insert rows).
CREATE POLICY "Admins create review cycles" ON public.performance_reviews
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin')
        )
    );

-- 3. Update:
-- Employees can update ONLY if status is 'Employee_Review' (Self Assessment)
CREATE POLICY "Employees update self assessment" ON public.performance_reviews
    FOR UPDATE
    USING (auth.uid() = employee_id AND status = 'Employee_Review')
    WITH CHECK (auth.uid() = employee_id AND status IN ('Employee_Review', 'Supervisor_Review')); -- Allow transition to Supervisor

-- Managers can update if status is 'Supervisor_Review'
CREATE POLICY "Managers update supervisor review" ON public.performance_reviews
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('Admin', 'Manager', 'Logistics Manager', 'Super Admin')
        )
        AND status = 'Supervisor_Review'
    );

-- NOTIFY RELOAD
NOTIFY pgrst, 'reload config';

SELECT 'Performance Reviews Schema Created' as status;
