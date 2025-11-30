import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: "admin" | "coordinator" | "employee" | null;
  role_id?: string;
}

export const useUserRolesQuery = () => {
  return useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRole[] = profiles.map((profile) => {
        const roleRecord = userRoles.find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at || "",
          role: roleRecord?.role || null,
          role_id: roleRecord?.id,
        };
      });

      return usersWithRoles;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};
