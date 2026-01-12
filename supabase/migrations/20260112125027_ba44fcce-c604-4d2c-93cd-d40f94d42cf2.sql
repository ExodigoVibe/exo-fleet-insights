-- Create a table for vehicle service information
CREATE TABLE public.vehicle_service_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_plate TEXT NOT NULL UNIQUE,
  next_service_mileage INTEGER,
  last_service_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vehicle_service_info ENABLE ROW LEVEL SECURITY;

-- Create policies - admins can manage, others can view
CREATE POLICY "Anyone can view vehicle service info" 
ON public.vehicle_service_info 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage vehicle service info" 
ON public.vehicle_service_info 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vehicle_service_info_updated_at
BEFORE UPDATE ON public.vehicle_service_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();