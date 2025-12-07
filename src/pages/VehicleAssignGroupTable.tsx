import { useState } from "react";
import { useAssignedVehiclesQuery, AssignedVehicle } from "@/hooks/queries/useAssignedVehiclesQuery";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Save, X, Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EditingRow {
  id: string;
  employee_name: string;
  license_plates: string;
}

export default function VehicleAssignGroupTable() {
  const { data: assignedVehicles = [], isLoading } = useAssignedVehiclesQuery();
  const queryClient = useQueryClient();
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [newRow, setNewRow] = useState<{ employee_name: string; license_plates: string } | null>(null);

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; employee_name: string; license_plates: string[] }) => {
      const { error } = await supabase
        .from("assigned_vehicles")
        .update({
          employee_name: data.employee_name,
          license_plates: data.license_plates,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assigned-vehicles"] });
      toast.success("Assignment updated successfully");
      setEditingRow(null);
    },
    onError: (error) => {
      toast.error("Failed to update assignment: " + error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { employee_name: string; license_plates: string[] }) => {
      const { error } = await supabase
        .from("assigned_vehicles")
        .insert({
          employee_name: data.employee_name,
          license_plates: data.license_plates,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assigned-vehicles"] });
      toast.success("Assignment created successfully");
      setNewRow(null);
    },
    onError: (error) => {
      toast.error("Failed to create assignment: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("assigned_vehicles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assigned-vehicles"] });
      toast.success("Assignment deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete assignment: " + error.message);
    },
  });

  const handleEdit = (vehicle: AssignedVehicle) => {
    setEditingRow({
      id: vehicle.id,
      employee_name: vehicle.employee_name,
      license_plates: vehicle.license_plates.join(", "),
    });
  };

  const handleSave = () => {
    if (!editingRow) return;

    const licensePlatesArray = editingRow.license_plates
      .split(",")
      .map((plate) => plate.trim())
      .filter((plate) => plate.length > 0);

    updateMutation.mutate({
      id: editingRow.id,
      employee_name: editingRow.employee_name,
      license_plates: licensePlatesArray,
    });
  };

  const handleCancel = () => {
    setEditingRow(null);
  };

  const handleAddNew = () => {
    setNewRow({ employee_name: "", license_plates: "" });
  };

  const handleSaveNew = () => {
    if (!newRow) return;

    const licensePlatesArray = newRow.license_plates
      .split(",")
      .map((plate) => plate.trim())
      .filter((plate) => plate.length > 0);

    if (!newRow.employee_name.trim() || licensePlatesArray.length === 0) {
      toast.error("Please fill in all fields");
      return;
    }

    createMutation.mutate({
      employee_name: newRow.employee_name,
      license_plates: licensePlatesArray,
    });
  };

  const handleCancelNew = () => {
    setNewRow(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vehicle Assign Groups</h1>
          <p className="text-muted-foreground">Manage vehicle assignments to employees</p>
        </div>
        <Button onClick={handleAddNew} disabled={!!newRow}>
          <Plus className="h-4 w-4 mr-2" />
          Add Assignment
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>License Plates</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newRow && (
              <TableRow>
                <TableCell>
                  <Input
                    value={newRow.employee_name}
                    onChange={(e) =>
                      setNewRow({ ...newRow, employee_name: e.target.value })
                    }
                    placeholder="Employee name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newRow.license_plates}
                    onChange={(e) =>
                      setNewRow({ ...newRow, license_plates: e.target.value })
                    }
                    placeholder="Comma-separated plates (e.g., ABC-123, DEF-456)"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNew}
                      disabled={createMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelNew}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {assignedVehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>
                  {editingRow?.id === vehicle.id ? (
                    <Input
                      value={editingRow.employee_name}
                      onChange={(e) =>
                        setEditingRow({
                          ...editingRow,
                          employee_name: e.target.value,
                        })
                      }
                    />
                  ) : (
                    vehicle.employee_name
                  )}
                </TableCell>
                <TableCell>
                  {editingRow?.id === vehicle.id ? (
                    <Input
                      value={editingRow.license_plates}
                      onChange={(e) =>
                        setEditingRow({
                          ...editingRow,
                          license_plates: e.target.value,
                        })
                      }
                      placeholder="Comma-separated plates"
                    />
                  ) : (
                    vehicle.license_plates.join(", ")
                  )}
                </TableCell>
                <TableCell>
                  {editingRow?.id === vehicle.id ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(vehicle)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the assignment for{" "}
                              {vehicle.employee_name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(vehicle.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {assignedVehicles.length === 0 && !newRow && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No vehicle assignments found. Click "Add Assignment" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
