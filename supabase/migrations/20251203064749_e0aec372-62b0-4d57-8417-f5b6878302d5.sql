-- Create storage bucket for vehicle request files
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-request-files', 'vehicle-request-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for vehicle request files
CREATE POLICY "Anyone can view vehicle request files"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-request-files');

CREATE POLICY "Authenticated users can upload vehicle request files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehicle-request-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own vehicle request files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vehicle-request-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own vehicle request files"
ON storage.objects FOR DELETE
USING (bucket_id = 'vehicle-request-files' AND auth.uid() IS NOT NULL);