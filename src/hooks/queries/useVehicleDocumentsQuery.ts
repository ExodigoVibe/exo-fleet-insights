import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VehicleDocument {
  id: string;
  license_plate: string;
  document_type: 'license' | 'insurance' | 'service';
  document_url: string | null;
  expiry_date: string;
  email_reminder_enabled: boolean;
  reminder_sent: boolean;
  next_service_mileage: number | null;
  last_service_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertVehicleDocumentInput {
  license_plate: string;
  document_type: 'license' | 'insurance' | 'service';
  document_url?: string | null;
  expiry_date?: string;
  email_reminder_enabled?: boolean;
  next_service_mileage?: number | null;
  last_service_date?: string | null;
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
      const { data: existing, error: fetchError } = await supabase
        .from("vehicle_information")
        .select("id, reminder_sent, expiry_date")
        .eq("license_plate", input.license_plate)
        .eq("document_type", input.document_type)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Reset reminder_sent if expiry_date changed
      const shouldResetReminder = existing && input.expiry_date && existing.expiry_date !== input.expiry_date;

      if (existing) {
        // Update existing document
        const updateData: Record<string, unknown> = {};
        
        if (input.document_url !== undefined) updateData.document_url = input.document_url;
        if (input.expiry_date !== undefined) updateData.expiry_date = input.expiry_date;
        if (input.email_reminder_enabled !== undefined) updateData.email_reminder_enabled = input.email_reminder_enabled;
        if (input.next_service_mileage !== undefined) updateData.next_service_mileage = input.next_service_mileage;
        if (input.last_service_date !== undefined) updateData.last_service_date = input.last_service_date;
        if (shouldResetReminder) updateData.reminder_sent = false;

        const { data, error } = await supabase
          .from("vehicle_information")
          .update(updateData)
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
            document_url: input.document_url || null,
            expiry_date: input.expiry_date || null,
            email_reminder_enabled: input.email_reminder_enabled || false,
            next_service_mileage: input.next_service_mileage || null,
            last_service_date: input.last_service_date || null,
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
      toast.success("Saved successfully");
    },
    onError: (error: any) => {
      console.error("Error saving vehicle information:", error);
      toast.error("Failed to save");
    },
  });
}
