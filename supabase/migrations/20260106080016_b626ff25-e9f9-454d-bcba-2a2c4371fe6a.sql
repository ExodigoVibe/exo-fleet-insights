-- Add assigned_by column to track who made the assignment
ALTER TABLE public.vehicle_assignments 
ADD COLUMN assigned_by_id uuid REFERENCES auth.users(id),
ADD COLUMN assigned_by_name text;