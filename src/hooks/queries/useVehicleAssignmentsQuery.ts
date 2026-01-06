import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VehicleAssignment {
  id: string;
  license_plate: string;
  driver_id: string | null;
  driver_name: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  assigned_by_id: string | null;
  assigned_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export function useVehicleAssignmentsQuery() {
  return useQuery({
    queryKey: ["vehicle-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_assignments")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data as VehicleAssignment[];
    },
  });
}

export function useVehicleAssignmentByPlateQuery(licensePlate: string) {
  return useQuery({
    queryKey: ["vehicle-assignment", licensePlate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_assignments")
        .select("*")
        .eq("license_plate", licensePlate)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as VehicleAssignment | null;
    },
    enabled: !!licensePlate,
  });
}

interface UpsertAssignmentParams {
  license_plate: string;
  driver_id: string | null;
  driver_name: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  assigned_by_id: string | null;
  assigned_by_name: string | null;
}

export function useUpsertVehicleAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpsertAssignmentParams) => {
      // Check if assignment exists for this license plate
      const { data: existing } = await supabase
        .from("vehicle_assignments")
        .select("id")
        .eq("license_plate", params.license_plate)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("vehicle_assignments")
          .update({
            driver_id: params.driver_id,
            driver_name: params.driver_name,
            status: params.status,
            start_date: params.start_date,
            end_date: params.end_date,
            assigned_by_id: params.assigned_by_id,
            assigned_by_name: params.assigned_by_name,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("vehicle_assignments")
          .insert({
            license_plate: params.license_plate,
            driver_id: params.driver_id,
            driver_name: params.driver_name,
            status: params.status,
            start_date: params.start_date,
            end_date: params.end_date,
            assigned_by_id: params.assigned_by_id,
            assigned_by_name: params.assigned_by_name,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-assignment"] });
      toast.success("Vehicle assignment saved successfully");
    },
    onError: (error) => {
      console.error("Error saving vehicle assignment:", error);
      toast.error("Failed to save vehicle assignment");
    },
  });
}
