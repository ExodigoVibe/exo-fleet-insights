-- Add file_urls array column to vehicle_requests for multiple file uploads
ALTER TABLE public.vehicle_requests 
ADD COLUMN IF NOT EXISTS file_urls text[] DEFAULT NULL;