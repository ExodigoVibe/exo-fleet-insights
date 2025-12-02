-- Enable RLS on all public tables to fix security linter errors

-- Enable RLS on form_templates (if not already enabled)
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

-- Enable RLS on event_reports (if not already enabled)
ALTER TABLE public.event_reports ENABLE ROW LEVEL SECURITY;

-- Enable RLS on vehicle_requests (if not already enabled)
ALTER TABLE public.vehicle_requests ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_roles (if not already enabled)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;