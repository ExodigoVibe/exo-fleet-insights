-- Create employee_documents table
CREATE TABLE public.employee_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_email TEXT,
  employee_name TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN ('drivers_license', 'signed_form')),
  document_url TEXT,
  document_name TEXT,
  expiry_date DATE,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view employee documents"
ON public.employee_documents
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and coordinators can manage employee documents"
ON public.employee_documents
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinator'::app_role));

CREATE POLICY "Users can manage their own documents"
ON public.employee_documents
FOR ALL
USING (employee_email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (employee_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_employee_documents_updated_at
BEFORE UPDATE ON public.employee_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_employee_documents_employee_id ON public.employee_documents(employee_id);
CREATE INDEX idx_employee_documents_employee_email ON public.employee_documents(employee_email);