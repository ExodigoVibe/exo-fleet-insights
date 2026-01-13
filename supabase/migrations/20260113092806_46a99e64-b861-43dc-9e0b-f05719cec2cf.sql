-- Make expiry_date nullable for service documents that don't need an expiry date
ALTER TABLE public.vehicle_information ALTER COLUMN expiry_date DROP NOT NULL;