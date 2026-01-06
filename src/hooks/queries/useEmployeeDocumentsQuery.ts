import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  employee_email: string | null;
  employee_name: string | null;
  document_type: 'drivers_license' | 'signed_form';
  document_url: string | null;
  document_name: string | null;
  expiry_date: string | null;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeDocumentInput {
  employee_id: string;
  employee_email?: string | null;
  employee_name?: string | null;
  document_type: 'drivers_license' | 'signed_form';
  document_url?: string | null;
  document_name?: string | null;
  expiry_date?: string | null;
}

export function useEmployeeDocumentsQuery(employeeId: string) {
  return useQuery({
    queryKey: ["employee-documents", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_documents")
        .select("*")
        .eq("employee_id", employeeId)
        .order("uploaded_at", { ascending: false });

      if (error) {
        console.error("Error fetching employee documents:", error);
        throw error;
      }

      return data as EmployeeDocument[];
    },
    enabled: !!employeeId,
  });
}

export function useEmployeeDocumentsByEmailQuery(email: string) {
  return useQuery({
    queryKey: ["employee-documents-by-email", email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_documents")
        .select("*")
        .eq("employee_email", email)
        .order("uploaded_at", { ascending: false });

      if (error) {
        console.error("Error fetching employee documents by email:", error);
        throw error;
      }

      return data as EmployeeDocument[];
    },
    enabled: !!email,
  });
}

export function useCreateEmployeeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEmployeeDocumentInput) => {
      const { data, error } = await supabase
        .from("employee_documents")
        .insert({
          employee_id: input.employee_id,
          employee_email: input.employee_email,
          employee_name: input.employee_name,
          document_type: input.document_type,
          document_url: input.document_url,
          document_name: input.document_name,
          expiry_date: input.expiry_date,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents", data.employee_id] });
      queryClient.invalidateQueries({ queryKey: ["employee-documents-by-email", data.employee_email] });
      toast.success("Document uploaded successfully");
    },
    onError: (error: any) => {
      console.error("Error creating employee document:", error);
      toast.error("Failed to upload document");
    },
  });
}

export function useDeleteEmployeeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, employeeId }: { id: string; employeeId: string }) => {
      const { error } = await supabase
        .from("employee_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, employeeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents", data.employeeId] });
      toast.success("Document deleted successfully");
    },
    onError: (error: any) => {
      console.error("Error deleting employee document:", error);
      toast.error("Failed to delete document");
    },
  });
}
