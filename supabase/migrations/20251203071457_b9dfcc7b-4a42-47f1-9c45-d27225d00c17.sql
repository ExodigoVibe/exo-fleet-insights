-- Drop the authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can create form templates" ON public.form_templates;
DROP POLICY IF EXISTS "Authenticated users can update form templates" ON public.form_templates;
DROP POLICY IF EXISTS "Authenticated users can delete form templates" ON public.form_templates;

-- Create permissive policies that allow access (similar to existing pattern)
CREATE POLICY "Allow insert form templates"
ON public.form_templates
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update form templates"
ON public.form_templates
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete form templates"
ON public.form_templates
FOR DELETE
USING (true);