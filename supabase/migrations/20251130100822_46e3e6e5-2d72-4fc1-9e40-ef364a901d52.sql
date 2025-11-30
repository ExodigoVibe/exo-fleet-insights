-- Remove RLS policy from form_templates
DROP POLICY IF EXISTS "Admins can manage form templates" ON public.form_templates;

-- Disable RLS on form_templates table
ALTER TABLE public.form_templates DISABLE ROW LEVEL SECURITY;