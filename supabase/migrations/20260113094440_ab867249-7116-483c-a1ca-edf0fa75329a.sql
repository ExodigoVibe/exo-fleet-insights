-- Add reminder_email column to vehicle_information table
ALTER TABLE public.vehicle_information 
ADD COLUMN reminder_email text;