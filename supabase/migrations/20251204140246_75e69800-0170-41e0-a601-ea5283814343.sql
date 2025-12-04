-- Add DELETE policy for profiles table (admins can delete)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also add public delete policy since Azure SSO doesn't create Supabase sessions
CREATE POLICY "Public can delete profiles"
ON public.profiles
FOR DELETE
USING (true);