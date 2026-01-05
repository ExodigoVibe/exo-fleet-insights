-- Create a table for vehicle assignments with date ranges
CREATE TABLE public.vehicle_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_plate TEXT NOT NULL,
  driver_id TEXT,
  driver_name TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vehicle_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view vehicle assignments" 
ON public.vehicle_assignments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and coordinators can manage vehicle assignments" 
ON public.vehicle_assignments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinator'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vehicle_assignments_updated_at
BEFORE UPDATE ON public.vehicle_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();