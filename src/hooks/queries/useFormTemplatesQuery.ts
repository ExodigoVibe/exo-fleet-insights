import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface FormTemplate {
  id: string;
  form_title: string;
  description: string | null;
  usage_type: string;
  form_type: string;
  pdf_template_url: string | null;
  is_active: boolean | null;
  form_fields: any;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateFormTemplateData {
  form_title: string;
  description?: string;
  usage_type: string;
  form_type: string;
  pdf_template_url?: string;
  is_active: boolean;
  form_fields: any;
}

export function useFormTemplatesQuery() {
  return useQuery({
    queryKey: ["form-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FormTemplate[];
    },
  });
}

export function useCreateFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFormTemplateData) => {
      const { data: template, error } = await supabase
        .from("form_templates")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-templates"] });
      toast({
        title: "Success",
        description: "Form template created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create form template: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateFormTemplateData> }) => {
      const { data: template, error } = await supabase
        .from("form_templates")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-templates"] });
      toast({
        title: "Success",
        description: "Form template updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update form template: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("form_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-templates"] });
      toast({
        title: "Success",
        description: "Form template deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete form template: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}
