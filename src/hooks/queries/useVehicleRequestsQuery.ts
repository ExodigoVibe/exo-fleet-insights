import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface VehicleRequest {
  id: string;
  full_name: string;
  department: string;
  job_title?: string;
  phone_number?: string;
  email?: string;
  usage_type: "single_use" | "permanent_driver";
  start_date: string;
  end_date?: string;
  purpose?: string;
  department_manager?: string;
  manager_email?: string;
  license_file_url?: string;
  status: "pending_manager" | "approved" | "rejected";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleRequestData {
  full_name: string;
  department: string;
  job_title?: string;
  phone_number?: string;
  email?: string;
  usage_type: "single_use" | "permanent_driver";
  start_date: string;
  end_date?: string;
  purpose?: string;
  department_manager?: string;
  manager_email?: string;
  license_file_url?: string;
  priority?: "low" | "medium" | "high";
}

export interface UpdateVehicleRequestData extends CreateVehicleRequestData {
  id: string;
}

export const useVehicleRequestsQuery = () => {
  return useQuery({
    queryKey: ["vehicle-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VehicleRequest[];
    },
  });
};

export const useCreateVehicleRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVehicleRequestData) => {
      const { data: request, error } = await supabase
        .from("vehicle_requests")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-requests"] });
      toast({
        title: "Success",
        description: "Vehicle request submitted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to submit vehicle request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateVehicleRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateVehicleRequestData) => {
      const { id, ...updateData } = data;
      const { data: request, error } = await supabase
        .from("vehicle_requests")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-requests"] });
      toast({
        title: "Success",
        description: "Vehicle request updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update vehicle request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteVehicleRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("vehicle_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-requests"] });
      toast({
        title: "Success",
        description: "Vehicle request deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete vehicle request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useApproveVehicleRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("vehicle_requests")
        .update({ status: "approved" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-requests"] });
      toast({
        title: "Success",
        description: "Vehicle request approved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve vehicle request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUndoApproveVehicleRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("vehicle_requests")
        .update({ status: "pending_manager" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-requests"] });
      toast({
        title: "Success",
        description: "Approval undone successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to undo approval: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
