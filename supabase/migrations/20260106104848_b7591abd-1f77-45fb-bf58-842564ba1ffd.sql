-- Drop the restrictive insert policy and create a permissive one
DROP POLICY IF EXISTS "Authenticated users can insert employee documents" ON public.employee_documents;

-- Create a PERMISSIVE policy for INSERT (default is permissive)
CREATE POLICY "Allow authenticated users to insert documents" 
ON public.employee_documents 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Also add permissive policies for update and delete for authenticated users
CREATE POLICY "Allow authenticated users to update documents" 
ON public.employee_documents 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete documents" 
ON public.employee_documents 
FOR DELETE 
TO authenticated 
USING (true);