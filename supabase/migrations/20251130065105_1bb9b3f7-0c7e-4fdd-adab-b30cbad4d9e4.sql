-- Create form_templates table
CREATE TABLE IF NOT EXISTS public.form_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_title TEXT NOT NULL,
  description TEXT,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('single_use', 'permanent', 'both')),
  form_type TEXT NOT NULL CHECK (form_type IN ('custom', 'vehicle_procedure', 'driver_file', 'traffic_history')),
  pdf_template_url TEXT,
  is_active BOOLEAN DEFAULT true,
  form_fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
  ON public.form_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_form_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_form_templates_updated_at
  BEFORE UPDATE ON public.form_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_form_templates_updated_at();