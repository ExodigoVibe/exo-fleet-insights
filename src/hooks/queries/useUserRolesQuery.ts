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
      // Fetch all user roles first (source of truth)
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Fetch profiles only for users that have roles
      const userIds = userRoles.map((r) => r.user_id);
      
      if (userIds.length === 0) return [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRole[] = userRoles.map((roleRecord) => {
        const profile = profiles.find((p) => p.id === roleRecord.user_id);
        return {
          id: roleRecord.user_id,
          email: profile?.email || roleRecord.email || "",
          full_name: profile?.full_name || roleRecord.full_name || "",
          created_at: profile?.created_at || "",
          role: roleRecord.role,
          role_id: roleRecord.id,
        };
      });

      return usersWithRoles;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};
