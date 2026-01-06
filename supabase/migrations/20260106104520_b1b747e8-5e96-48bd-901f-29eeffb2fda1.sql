-- Add policy to allow authenticated users to insert employee documents
CREATE POLICY "Authenticated users can insert employee documents" 
ON public.employee_documents 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);