-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Users can create form templates" ON public.form_templates;
DROP POLICY IF EXISTS "Users can update form templates" ON public.form_templates;
DROP POLICY IF EXISTS "Users can delete form templates" ON public.form_templates;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Authenticated users can create form templates"
ON public.form_templates
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update form templates"
ON public.form_templates
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete form templates"
ON public.form_templates
FOR DELETE
TO authenticated
USING (true);