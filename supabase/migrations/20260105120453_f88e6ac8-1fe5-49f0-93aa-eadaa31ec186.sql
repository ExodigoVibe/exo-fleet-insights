-- Create a table to store vehicle documents with expiry dates and reminder preferences
CREATE TABLE public.vehicle_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_plate TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('license', 'insurance')),
  document_url TEXT,
  expiry_date DATE NOT NULL,
  email_reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(license_plate, document_type)
);

-- Enable Row Level Security
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for access (admins and coordinators can manage)
CREATE POLICY "Authenticated users can view vehicle documents"
ON public.vehicle_documents
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and coordinators can manage vehicle documents"
ON public.vehicle_documents
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinator'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vehicle_documents_updated_at
BEFORE UPDATE ON public.vehicle_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();