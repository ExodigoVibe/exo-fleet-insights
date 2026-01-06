-- Remove the foreign key constraint on assigned_by_id since Azure SSO users don't have auth.users entries
ALTER TABLE public.vehicle_assignments 
DROP CONSTRAINT IF EXISTS vehicle_assignments_assigned_by_id_fkey;

-- Change assigned_by_id to text type to handle non-UUID values from Azure SSO
ALTER TABLE public.vehicle_assignments 
ALTER COLUMN assigned_by_id TYPE text USING assigned_by_id::text;