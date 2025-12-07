-- Add policy for public update on user_roles (Azure SSO doesn't create Supabase auth session)
CREATE POLICY "Public can update user_roles"
ON public.user_roles
FOR UPDATE
USING (true)
WITH CHECK (true);