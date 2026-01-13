-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins and coordinators can manage vehicle documents" ON public.vehicle_information;
DROP POLICY IF EXISTS "Authenticated users can view vehicle documents" ON public.vehicle_information;

-- Create permissive policies since auth is handled at application level via Azure SSO
CREATE POLICY "Allow all operations on vehicle_information"
ON public.vehicle_information
FOR ALL
USING (true)
WITH CHECK (true);