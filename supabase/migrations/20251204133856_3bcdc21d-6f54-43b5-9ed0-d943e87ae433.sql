-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read department managers" ON public.department_managers;
DROP POLICY IF EXISTS "Admins can manage department managers" ON public.department_managers;

-- Create public read policy (since Azure SSO doesn't create Supabase sessions)
CREATE POLICY "Public can read department managers"
ON public.department_managers
FOR SELECT
USING (true);

-- Allow public insert/update/delete for now (Azure SSO users)
CREATE POLICY "Public can manage department managers"
ON public.department_managers
FOR ALL
USING (true)
WITH CHECK (true);