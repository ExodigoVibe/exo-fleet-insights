-- Create department_managers table
CREATE TABLE public.department_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT NOT NULL,
  job_title TEXT,
  employee_id TEXT,
  department TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.department_managers ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read department managers
CREATE POLICY "Authenticated users can read department managers"
ON public.department_managers
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify department managers
CREATE POLICY "Admins can manage department managers"
ON public.department_managers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));