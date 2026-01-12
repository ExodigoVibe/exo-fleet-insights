-- Add service information columns to vehicle_information table
ALTER TABLE public.vehicle_information 
ADD COLUMN IF NOT EXISTS next_service_mileage INTEGER,
ADD COLUMN IF NOT EXISTS last_service_date DATE;