-- Create storage bucket for event report files
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-report-files', 'event-report-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for event report files
CREATE POLICY "Anyone can view event report files"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-report-files');

CREATE POLICY "Authenticated users can upload event report files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-report-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own event report files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-report-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own event report files"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-report-files' AND auth.uid() IS NOT NULL);