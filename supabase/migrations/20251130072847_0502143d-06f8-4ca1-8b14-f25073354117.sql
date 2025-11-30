-- Create vehicle_requests table
CREATE TABLE public.vehicle_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  job_title TEXT,
  phone_number TEXT,
  email TEXT,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('single_use', 'permanent_driver')),
  start_date DATE NOT NULL,
  end_date DATE,
  purpose TEXT,
  department_manager TEXT,
  manager_email TEXT,
  license_file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending_manager' CHECK (status IN ('pending_manager', 'approved', 'rejected')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vehicle_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations temporarily
CREATE POLICY "Allow all operations temporarily" 
ON public.vehicle_requests 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vehicle_requests_updated_at
BEFORE UPDATE ON public.vehicle_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();