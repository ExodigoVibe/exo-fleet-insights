-- Make start_date nullable in vehicle_assignments table
ALTER TABLE public.vehicle_assignments 
ALTER COLUMN start_date DROP NOT NULL;