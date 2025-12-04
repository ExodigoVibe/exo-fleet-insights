-- Create assigned_vehicles table
CREATE TABLE public.assigned_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  license_plates TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assigned_vehicles ENABLE ROW LEVEL SECURITY;

-- Create public read policy (Azure SSO doesn't create Supabase sessions)
CREATE POLICY "Public can read assigned vehicles"
ON public.assigned_vehicles
FOR SELECT
USING (true);

-- Allow public management
CREATE POLICY "Public can manage assigned vehicles"
ON public.assigned_vehicles
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_assigned_vehicles_updated_at
BEFORE UPDATE ON public.assigned_vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();