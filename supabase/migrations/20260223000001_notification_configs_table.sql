-- Create the staff_notification_configs table
CREATE TABLE IF NOT EXISTS public.staff_notification_configs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_name text NOT NULL,
    email text,
    whatsapp text,
    telegram text,
    is_active boolean DEFAULT true,
    is_sender boolean DEFAULT false, -- To mark the sender/admin for copy/CC
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_notification_configs ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (or service_role)
CREATE POLICY "Allow read access for authenticated users" 
ON public.staff_notification_configs FOR SELECT 
TO authenticated USING (true);

-- Insert the initial data
INSERT INTO public.staff_notification_configs (staff_name, email, whatsapp, telegram, is_sender)
VALUES 
('Akin', 'akinbee@gmail.com', '+2348032009441', '@akinbsworld', true),
('Toxsy', 'toxsyyb@yahoo.co.uk', '+2348032019441', NULL, false),
('Tomiwa', 'tomiwab@hotmail.com', '+2347067317314', NULL, false);
