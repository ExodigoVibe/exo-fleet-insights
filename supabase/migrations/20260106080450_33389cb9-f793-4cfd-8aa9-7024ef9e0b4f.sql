-- Drop existing restrictive policies on vehicle_assignments
DROP POLICY IF EXISTS "Authenticated users can view vehicle assignments" ON public.vehicle_assignments;
DROP POLICY IF EXISTS "Admins and coordinators can manage vehicle assignments" ON public.vehicle_assignments;

-- Create public access policies for vehicle_assignments since app uses Azure SSO (not Supabase auth)
CREATE POLICY "Public can view vehicle assignments"
ON public.vehicle_assignments
FOR SELECT
USING (true);

CREATE POLICY "Public can manage vehicle assignments"
ON public.vehicle_assignments
FOR ALL
USING (true)
WITH CHECK (true);