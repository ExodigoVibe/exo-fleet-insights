import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VehicleServiceInfo {
  id: string;
  license_plate: string;
  next_service_mileage: number | null;
  last_service_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useVehicleServiceInfoQuery(licensePlate: string) {
  return useQuery({
    queryKey: ["vehicle-service-info", licensePlate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_service_info")
        .select("*")
        .eq("license_plate", licensePlate)
        .maybeSingle();

      if (error) throw error;
      return data as VehicleServiceInfo | null;
    },
    enabled: !!licensePlate,
  });
}

export interface UpsertServiceInfoParams {
  license_plate: string;
  next_service_mileage: number | null;
  last_service_date: string | null;
}

export function useUpsertVehicleServiceInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpsertServiceInfoParams) => {
      const { data, error } = await supabase
        .from("vehicle_service_info")
        .upsert(
          {
            license_plate: params.license_plate,
            next_service_mileage: params.next_service_mileage,
            last_service_date: params.last_service_date,
          },
          { onConflict: "license_plate" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["vehicle-service-info", variables.license_plate],
      });
      toast.success("Service information saved successfully");
    },
    onError: (error) => {
      console.error("Error saving service info:", error);
      toast.error("Failed to save service information");
    },
  });
}
