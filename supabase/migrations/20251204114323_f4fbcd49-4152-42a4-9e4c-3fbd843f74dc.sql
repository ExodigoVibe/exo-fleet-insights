-- Add signature-related columns to vehicle_requests
ALTER TABLE public.vehicle_requests
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signed_template_id UUID REFERENCES public.form_templates(id);