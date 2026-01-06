-- Add policies for anon role as well (in case auth token isn't being passed correctly)
CREATE POLICY "Anon can select employee documents" 
ON public.employee_documents 
FOR SELECT 
TO anon 
USING (true);

CREATE POLICY "Anon can insert employee documents" 
ON public.employee_documents 
FOR INSERT 
TO anon 
WITH CHECK (true);

CREATE POLICY "Anon can update employee documents" 
ON public.employee_documents 
FOR UPDATE 
TO anon 
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can delete employee documents" 
ON public.employee_documents 
FOR DELETE 
TO anon 
USING (true);