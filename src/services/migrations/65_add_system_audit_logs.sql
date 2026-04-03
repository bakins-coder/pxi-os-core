-- [1] Create System Audit Logs Table
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID,
    event_type TEXT NOT NULL, -- 'LOGIN', 'SIGNUP', 'LOGOUT', 'ACTIVATION_SYNC', 'FAILURE'
    status TEXT NOT NULL DEFAULT 'SUCCESS', 
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- [2] Enable RLS on audit_logs
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- [3] Audit Logs Policies
-- Admins can view logs for their own organization
CREATE POLICY "Admins can view their org's audit logs"
    ON public.system_audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.organization_id = system_audit_logs.organization_id
            AND profiles.role IN ('CEO', 'Admin')
        )
    );

-- [4] 90-Day Purge Function (Audit compliance)
CREATE OR REPLACE FUNCTION purge_stale_audit_logs() RETURNS void AS $$
BEGIN
    DELETE FROM public.system_audit_logs WHERE created_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- [5] Automated cleanup trigger (CRON/Manual)
-- For now, we'll just expose it as a function.

-- [6] Clear Xquisite Placeholder IDs for Activation
-- This allows XQ-0011, XQ-0012, XQ-0014 etc to use 'Join Team' to re-activate
UPDATE public.employees 
SET user_id = NULL 
WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6'
AND staff_id NOT IN ('XQ-0000', 'XQ-0001', 'XQ-0002', 'XQ-0005', 'XQ-0006', 'XQ-0010', 'XQ-0013');

-- [7] Delete ghost profiles that were never activated
DELETE FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM employees WHERE user_id IS NOT NULL)
AND organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6'
AND is_super_admin = false;
