-- Drop ALL existing restrictive policies on employee_documents
DROP POLICY IF EXISTS "Authenticated users can view employee documents" ON public.employee_documents;
DROP POLICY IF EXISTS "Admins and coordinators can manage employee documents" ON public.employee_documents;
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.employee_documents;
DROP POLICY IF EXISTS "Allow authenticated users to insert documents" ON public.employee_documents;
DROP POLICY IF EXISTS "Allow authenticated users to update documents" ON public.employee_documents;
DROP POLICY IF EXISTS "Allow authenticated users to delete documents" ON public.employee_documents;

-- Create simple PERMISSIVE policies for authenticated users
CREATE POLICY "Authenticated can select employee documents" 
ON public.employee_documents 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated can insert employee documents" 
ON public.employee_documents 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated can update employee documents" 
ON public.employee_documents 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated can delete employee documents" 
ON public.employee_documents 
FOR DELETE 
TO authenticated 
USING (true);