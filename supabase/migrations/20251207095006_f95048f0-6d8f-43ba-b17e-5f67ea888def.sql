-- Add policy for public delete on user_roles (Azure SSO doesn't create Supabase auth session)
CREATE POLICY "Public can delete user_roles"
ON public.user_roles
FOR DELETE
USING (true);