-- Create storage bucket for form template files
INSERT INTO storage.buckets (id, name, public) VALUES ('form-template-files', 'form-template-files', true);

-- Create RLS policies for form template files bucket
CREATE POLICY "Anyone can view form template files"
ON storage.objects FOR SELECT
USING (bucket_id = 'form-template-files');

CREATE POLICY "Authenticated users can upload form template files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'form-template-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update form template files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'form-template-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete form template files"
ON storage.objects FOR DELETE
USING (bucket_id = 'form-template-files' AND auth.uid() IS NOT NULL);