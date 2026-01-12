import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VehicleDocument {
  id: string;
  license_plate: string;
  document_type: 'license' | 'insurance';
  document_url: string | null;
  expiry_date: string;
  email_reminder_enabled: boolean;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpsertVehicleDocumentInput {
  license_plate: string;
  document_type: 'license' | 'insurance';
  document_url?: string | null;
  expiry_date: string;
  email_reminder_enabled: boolean;
}

export function useVehicleDocumentsQuery(licensePlate: string) {
  return useQuery({
    queryKey: ["vehicle-documents", licensePlate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_information")
        .select("*")
        .eq("license_plate", licensePlate);

      if (error) {
        console.error("Error fetching vehicle documents:", error);
        throw error;
      }

      return data as VehicleDocument[];
    },
    enabled: !!licensePlate,
  });
}

export function useUpsertVehicleDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertVehicleDocumentInput) => {
      // Check if document already exists
      const { data: existing } = await supabase
        .from("vehicle_information")
        .select("id, reminder_sent, expiry_date")
        .eq("license_plate", input.license_plate)
        .eq("document_type", input.document_type)
        .single();

      // Reset reminder_sent if expiry_date changed
      const shouldResetReminder = existing && existing.expiry_date !== input.expiry_date;

      if (existing) {
        // Update existing document
        const { data, error } = await supabase
          .from("vehicle_information")
          .update({
            document_url: input.document_url,
            expiry_date: input.expiry_date,
            email_reminder_enabled: input.email_reminder_enabled,
            reminder_sent: shouldResetReminder ? false : existing.reminder_sent,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new document
        const { data, error } = await supabase
          .from("vehicle_information")
          .insert({
            license_plate: input.license_plate,
            document_type: input.document_type,
            document_url: input.document_url,
            expiry_date: input.expiry_date,
            email_reminder_enabled: input.email_reminder_enabled,
            reminder_sent: false,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-documents", data.license_plate] });
      toast.success("Document saved successfully");
    },
    onError: (error: any) => {
      console.error("Error saving vehicle document:", error);
      toast.error("Failed to save document");
    },
  });
}
