-- Fix RLS policies for event_reports to ensure authenticated users can create reports

-- Drop existing policies
DROP POLICY IF EXISTS "Employees can create their own event reports" ON public.event_reports;
DROP POLICY IF EXISTS "Employees can update their own event reports" ON public.event_reports;
DROP POLICY IF EXISTS "Employees can view their own event reports" ON public.event_reports;
DROP POLICY IF EXISTS "Admins and coordinators can view all event reports" ON public.event_reports;
DROP POLICY IF EXISTS "Admins and coordinators can manage all event reports" ON public.event_reports;

-- Allow authenticated users to insert event reports
CREATE POLICY "Authenticated users can create event reports"
ON public.event_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view their own event reports (by employee_name matching their email)
CREATE POLICY "Users can view their own event reports"
ON public.event_reports
FOR SELECT
TO authenticated
USING (
  employee_name = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'coordinator'::app_role)
);

-- Allow users to update their own event reports
CREATE POLICY "Users can update their own event reports"
ON public.event_reports
FOR UPDATE
TO authenticated
USING (
  employee_name = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'coordinator'::app_role)
)
WITH CHECK (
  employee_name = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'coordinator'::app_role)
);

-- Allow admins and coordinators to delete event reports
CREATE POLICY "Admins and coordinators can delete event reports"
ON public.event_reports
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'coordinator'::app_role)
);