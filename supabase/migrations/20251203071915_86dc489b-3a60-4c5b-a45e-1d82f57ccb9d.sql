-- Drop existing storage policies for form-template-files bucket
DROP POLICY IF EXISTS "Anyone can view form template files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload form template files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update form template files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete form template files" ON storage.objects;

-- Create public access policies for form-template-files bucket
CREATE POLICY "Public view form template files"
ON storage.objects FOR SELECT
USING (bucket_id = 'form-template-files');

CREATE POLICY "Public upload form template files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'form-template-files');

CREATE POLICY "Public update form template files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'form-template-files')
WITH CHECK (bucket_id = 'form-template-files');

CREATE POLICY "Public delete form template files"
ON storage.objects FOR DELETE
USING (bucket_id = 'form-template-files');