-- Drop existing restrictive policies for vehicle-request-files bucket
DROP POLICY IF EXISTS "Authenticated users can upload vehicle request files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own vehicle request files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own vehicle request files" ON storage.objects;

-- Create permissive policies for vehicle-request-files bucket
CREATE POLICY "Allow uploads to vehicle-request-files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehicle-request-files');

CREATE POLICY "Allow updates to vehicle-request-files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vehicle-request-files');

CREATE POLICY "Allow deletes from vehicle-request-files"
ON storage.objects FOR DELETE
USING (bucket_id = 'vehicle-request-files');

-- Drop existing restrictive policies for event-report-files bucket
DROP POLICY IF EXISTS "Authenticated users can upload event report files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own event report files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own event report files" ON storage.objects;

-- Create permissive policies for event-report-files bucket
CREATE POLICY "Allow uploads to event-report-files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-report-files');

CREATE POLICY "Allow updates to event-report-files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-report-files');

CREATE POLICY "Allow deletes from event-report-files"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-report-files');