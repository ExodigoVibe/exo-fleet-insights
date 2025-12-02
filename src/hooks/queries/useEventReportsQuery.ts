import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface EventReport {
  id: string;
  vehicle_license_plate: string;
  employee_name: string;
  event_date: string;
  location: string;
  description?: string;
  severity: "slight" | "extensive";
  status: "pending" | "reviewed" | "closed";
  third_party_involved: boolean;
  third_party_name?: string;
  third_party_phone?: string;
  third_party_license_plate?: string;
  third_party_insurance?: string;
  photo_urls?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateEventReportData {
  vehicle_license_plate: string;
  employee_name: string;
  event_date: string;
  location: string;
  description?: string;
  severity: "slight" | "extensive";
  third_party_involved: boolean;
  third_party_name?: string;
  third_party_phone?: string;
  third_party_license_plate?: string;
  third_party_insurance?: string;
  photo_urls?: string[];
}

export const useEventReportsQuery = () => {
  return useQuery({
    queryKey: ["event-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_reports")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;
      return data as EventReport[];
    },
  });
};

export const useCreateEventReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEventReportData) => {
      const { data: report, error } = await supabase
        .from("event_reports")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-reports"] });
      toast({
        title: "Success",
        description: "Event report submitted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to submit event report: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
