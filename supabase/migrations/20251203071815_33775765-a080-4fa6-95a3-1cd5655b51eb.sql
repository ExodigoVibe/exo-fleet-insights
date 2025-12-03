-- Drop ALL existing policies on form_templates
DROP POLICY IF EXISTS "Authenticated users can view active form templates" ON public.form_templates;
DROP POLICY IF EXISTS "Admins can manage form templates" ON public.form_templates;
DROP POLICY IF EXISTS "Users can view all form templates" ON public.form_templates;
DROP POLICY IF EXISTS "Allow insert form templates" ON public.form_templates;
DROP POLICY IF EXISTS "Allow update form templates" ON public.form_templates;
DROP POLICY IF EXISTS "Allow delete form templates" ON public.form_templates;

-- Create simple permissive policies for all operations
CREATE POLICY "Public select form templates"
ON public.form_templates
FOR SELECT
USING (true);

CREATE POLICY "Public insert form templates"
ON public.form_templates
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update form templates"
ON public.form_templates
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public delete form templates"
ON public.form_templates
FOR DELETE
USING (true);