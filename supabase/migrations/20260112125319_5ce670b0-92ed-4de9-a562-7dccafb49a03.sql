-- Rename vehicle_documents to vehicle_information
ALTER TABLE public.vehicle_documents RENAME TO vehicle_information;

-- Drop vehicle_service_info table
DROP TABLE IF EXISTS public.vehicle_service_info;