import { useState } from 'react';
import {
  useAssignedVehiclesQuery,
  AssignedVehicle,
} from '@/hooks/queries/useAssignedVehiclesQuery';
import { useSnowflakeDrivers } from '@/hooks/useSnowflakeDrivers';
import { useSnowflakeVehicles } from '@/hooks/useSnowflakeVehicles';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Save, X, Trash2, Plus, Check, ChevronsUpDown } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface EditingRow {
  id: string;
  employee_name: string;
  license_plates: string[];
}

export default function VehicleAssignGroupTable() {
  const { data: assignedVehicles = [], isLoading } = useAssignedVehiclesQuery();
  const { drivers, loading: driversLoading } = useSnowflakeDrivers();
  const { vehicles, loading: vehiclesLoading } = useSnowflakeVehicles();
  const queryClient = useQueryClient();
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [newRow, setNewRow] = useState<{ employee_name: string; license_plates: string[] } | null>(
    null,
  );
  const [newPlatesOpen, setNewPlatesOpen] = useState(false);
  const [editPlatesOpen, setEditPlatesOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; employee_name: string; license_plates: string[] }) => {
      const { error } = await supabase
        .from('assigned_vehicles')
        .update({
          employee_name: data.employee_name,
          license_plates: data.license_plates,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assigned-vehicles'] });
      toast.success('Assignment updated successfully');
      setEditingRow(null);
    },
    onError: (error) => {
      toast.error('Failed to update assignment: ' + error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { employee_name: string; license_plates: string[] }) => {
      const { error } = await supabase.from('assigned_vehicles').insert({
        employee_name: data.employee_name,
        license_plates: data.license_plates,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assigned-vehicles'] });
      toast.success('Assignment created successfully');
      setNewRow(null);
    },
    onError: (error) => {
      toast.error('Failed to create assignment: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assigned_vehicles').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assigned-vehicles'] });
      toast.success('Assignment deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete assignment: ' + error.message);
    },
  });

  const handleEdit = (vehicle: AssignedVehicle) => {
    setEditingRow({
      id: vehicle.id,
      employee_name: vehicle.employee_name,
      license_plates: [...vehicle.license_plates],
    });
  };

  const handleSave = () => {
    if (!editingRow) return;

    updateMutation.mutate({
      id: editingRow.id,
      employee_name: editingRow.employee_name,
      license_plates: editingRow.license_plates,
    });
  };

  const toggleEditPlate = (plate: string) => {
    if (!editingRow) return;
    const plates = editingRow.license_plates.includes(plate)
      ? editingRow.license_plates.filter((p) => p !== plate)
      : [...editingRow.license_plates, plate];
    setEditingRow({ ...editingRow, license_plates: plates });
  };

  const handleCancel = () => {
    setEditingRow(null);
  };

  const handleAddNew = () => {
    setNewRow({ employee_name: '', license_plates: [] });
  };

  const handleSaveNew = () => {
    if (!newRow) return;

    if (!newRow.employee_name.trim() || newRow.license_plates.length === 0) {
      toast.error('Please fill in all fields');
      return;
    }

    createMutation.mutate({
      employee_name: newRow.employee_name,
      license_plates: newRow.license_plates,
    });
  };

  const toggleNewPlate = (plate: string) => {
    if (!newRow) return;
    const plates = newRow.license_plates.includes(plate)
      ? newRow.license_plates.filter((p) => p !== plate)
      : [...newRow.license_plates, plate];
    setNewRow({ ...newRow, license_plates: plates });
  };

  const driverOptions = drivers.map((d) => `${d.first_name} ${d.last_name}`).sort();
  const vehiclePlates = vehicles.map((v) => v.license_plate).sort();

  const handleCancelNew = () => {
    setNewRow(null);
  };

  if (isLoading || driversLoading || vehiclesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vehicle Assign Groups</h1>
            <p className="text-muted-foreground mt-1">Manage vehicle assignments to employees</p>
          </div>
          <Button onClick={handleAddNew} disabled={!!newRow}>
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </Button>
        </div>

        <div className="border rounded-lg bg-card overflow-hidden mt-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Employee Name</TableHead>
                <TableHead className="font-semibold">License Plates</TableHead>
                <TableHead className="w-[150px] font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {newRow && (
                <TableRow className="bg-primary/5">
                  <TableCell>
                    <Select
                      value={newRow.employee_name}
                      onValueChange={(value) => setNewRow({ ...newRow, employee_name: value })}
                    >
                      <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {driverOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Popover open={newPlatesOpen} onOpenChange={setNewPlatesOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between hover:bg-gray-100 hover:text-foreground"
                        >
                          {newRow.license_plates.length > 0
                            ? `${newRow.license_plates.length} plate(s) selected`
                            : 'Select plates...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 bg-popover" align="start">
                        <div className="max-h-[300px] overflow-y-auto p-2">
                          {vehiclePlates.map((plate) => (
                            <div
                              key={plate}
                              className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                              onClick={() => toggleNewPlate(plate)}
                            >
                              <Checkbox
                                checked={newRow.license_plates.includes(plate)}
                                onCheckedChange={() => toggleNewPlate(plate)}
                              />
                              <span className="text-sm">{plate}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" onClick={handleSaveNew} disabled={createMutation.isPending}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelNew}
                        className="hover:bg-gray-100 hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {assignedVehicles.map((vehicle) => (
                <TableRow key={vehicle.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {editingRow?.id === vehicle.id ? (
                      <Select
                        value={editingRow.employee_name}
                        onValueChange={(value) =>
                          setEditingRow({ ...editingRow, employee_name: value })
                        }
                      >
                        <SelectTrigger className="max-w-xs">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {driverOptions.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      vehicle.employee_name
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {editingRow?.id === vehicle.id ? (
                      <Popover open={editPlatesOpen} onOpenChange={setEditPlatesOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between hover:bg-gray-100 hover:text-foreground"
                          >
                            {editingRow.license_plates.length > 0
                              ? `${editingRow.license_plates.length} plate(s) selected`
                              : 'Select plates...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 bg-popover" align="start">
                          <div className="max-h-[300px] overflow-y-auto p-2">
                            {vehiclePlates.map((plate) => (
                              <div
                                key={plate}
                                className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                                onClick={() => toggleEditPlate(plate)}
                              >
                                <Checkbox
                                  checked={editingRow.license_plates.includes(plate)}
                                  onCheckedChange={() => toggleEditPlate(plate)}
                                />
                                <span className="text-sm">{plate}</span>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      vehicle.license_plates.join(', ')
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      {editingRow?.id === vehicle.id ? (
                        <>
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
                            className="hover:bg-gray-100 hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(vehicle)}
                            className="hover:bg-gray-100 hover:text-foreground"
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
                                  Are you sure you want to delete the assignment for{' '}
                                  {vehicle.employee_name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="hover:bg-gray-100 hover:text-foreground">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(vehicle.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
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
    </div>
  );
}
