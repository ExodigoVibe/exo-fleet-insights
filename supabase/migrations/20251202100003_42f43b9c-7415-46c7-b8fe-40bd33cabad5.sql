-- Create RLS policies for form_templates table
CREATE POLICY "Users can view all form templates"
  ON public.form_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create form templates"
  ON public.form_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update form templates"
  ON public.form_templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete form templates"
  ON public.form_templates
  FOR DELETE
  TO authenticated
  USING (true);