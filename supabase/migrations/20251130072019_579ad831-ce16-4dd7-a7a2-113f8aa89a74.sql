-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create event_reports table
CREATE TABLE public.event_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_license_plate TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('slight', 'extensive')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'closed')),
  third_party_involved BOOLEAN DEFAULT false,
  third_party_name TEXT,
  third_party_phone TEXT,
  third_party_license_plate TEXT,
  third_party_insurance TEXT,
  photo_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.event_reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations temporarily
CREATE POLICY "Allow all operations temporarily" 
ON public.event_reports 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_event_reports_updated_at
BEFORE UPDATE ON public.event_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();