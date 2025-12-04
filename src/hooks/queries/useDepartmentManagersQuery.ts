import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DepartmentManager {
  id: string;
  display_name: string;
  job_title: string | null;
  employee_id: string | null;
  department: string;
  email: string;
  created_at: string;
}

export function useDepartmentManagersQuery() {
  return useQuery({
    queryKey: ["department_managers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_managers")
        .select("*")
        .order("display_name");

      if (error) {
        console.error("Error fetching department managers:", error);
        throw error;
      }

      return data as DepartmentManager[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  });
}

// Helper to get unique departments
export function useUniqueDepartments() {
  const { data: managers = [], ...rest } = useDepartmentManagersQuery();
  
  const uniqueDepartments = [...new Set(managers.map(m => m.department))].sort();
  
  return { departments: uniqueDepartments, ...rest };
}
