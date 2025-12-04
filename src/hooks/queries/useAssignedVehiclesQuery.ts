import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AssignedVehicle {
  id: string;
  employee_name: string;
  license_plates: string[];
  created_at: string;
  updated_at: string;
}

export function useAssignedVehiclesQuery() {
  return useQuery({
    queryKey: ["assigned-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assigned_vehicles")
        .select("*")
        .order("employee_name");

      if (error) throw error;
      return data as AssignedVehicle[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
