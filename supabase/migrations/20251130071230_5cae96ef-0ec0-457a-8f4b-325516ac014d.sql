-- Temporarily allow unauthenticated access to form_templates until Azure SSO is implemented
-- This updates the existing RLS policy to allow both authenticated and unauthenticated users

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON form_templates;

CREATE POLICY "Allow all operations temporarily"
ON form_templates
FOR ALL
TO public
USING (true)
WITH CHECK (true);