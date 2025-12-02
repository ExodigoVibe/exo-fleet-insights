-- Enable RLS on vehicle_requests table
ALTER TABLE public.vehicle_requests ENABLE ROW LEVEL SECURITY;

-- Enable RLS on event_reports table
ALTER TABLE public.event_reports ENABLE ROW LEVEL SECURITY;

-- Drop the overly permissive development policy on profiles
DROP POLICY IF EXISTS "Allow read access to profiles during development" ON public.profiles;

-- Create RLS policies for vehicle_requests
-- Admins and coordinators can view all requests
CREATE POLICY "Admins and coordinators can view all vehicle requests"
ON public.vehicle_requests
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'coordinator'::app_role)
);

-- Employees can only view their own requests based on email
CREATE POLICY "Employees can view their own vehicle requests"
ON public.vehicle_requests
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'employee'::app_role) AND 
  email = get_user_email(auth.uid())
);

-- Admins and coordinators can insert, update, delete all requests
CREATE POLICY "Admins and coordinators can manage all vehicle requests"
ON public.vehicle_requests
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'coordinator'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'coordinator'::app_role)
);

-- Employees can insert their own requests
CREATE POLICY "Employees can create their own vehicle requests"
ON public.vehicle_requests
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'employee'::app_role)
);

-- Employees can update their own requests
CREATE POLICY "Employees can update their own vehicle requests"
ON public.vehicle_requests
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'employee'::app_role) AND 
  email = get_user_email(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'employee'::app_role) AND 
  email = get_user_email(auth.uid())
);

-- Create RLS policies for event_reports
-- Admins and coordinators can view all event reports
CREATE POLICY "Admins and coordinators can view all event reports"
ON public.event_reports
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'coordinator'::app_role)
);

-- Employees can only view their own event reports based on employee_name matching their email
CREATE POLICY "Employees can view their own event reports"
ON public.event_reports
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'employee'::app_role) AND 
  employee_name = get_user_email(auth.uid())
);

-- Admins and coordinators can manage all event reports
CREATE POLICY "Admins and coordinators can manage all event reports"
ON public.event_reports
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'coordinator'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'coordinator'::app_role)
);

-- Employees can create their own event reports
CREATE POLICY "Employees can create their own event reports"
ON public.event_reports
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'employee'::app_role)
);

-- Employees can update their own event reports
CREATE POLICY "Employees can update their own event reports"
ON public.event_reports
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'employee'::app_role) AND 
  employee_name = get_user_email(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'employee'::app_role) AND 
  employee_name = get_user_email(auth.uid())
);

-- Create proper profiles policies
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Form templates - allow authenticated users to read active templates
CREATE POLICY "Authenticated users can view active form templates"
ON public.form_templates
FOR SELECT
TO authenticated
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage form templates
CREATE POLICY "Admins can manage form templates"
ON public.form_templates
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));