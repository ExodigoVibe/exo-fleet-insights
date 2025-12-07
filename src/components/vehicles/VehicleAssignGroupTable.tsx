import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignedVehicle } from '@/hooks/queries/useAssignedVehiclesQuery';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Pencil, Save, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface VehicleAssignGroupTableProps {
  data: AssignedVehicle[] | undefined;
  isLoading: boolean;
}

interface EditingRow {
  id: string;
  employee_name: string;
  license_plates: string;
}

export function VehicleAssignGroupTable({ data, isLoading }: VehicleAssignGroupTableProps) {
  const queryClient = useQueryClient();
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRow, setNewRow] = useState({ employee_name: '', license_plates: '' });

  const updateMutation = useMutation({
    mutationFn: async ({ id, employee_name, license_plates }: { id: string; employee_name: string; license_plates: string[] }) => {
      const { error } = await supabase
        .from('assigned_vehicles')
        .update({ employee_name, license_plates })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assigned-vehicles'] });
      toast.success('Assignment updated successfully');
      setEditingRow(null);
    },
    onError: (error) => {
      toast.error('Failed to update assignment');
      console.error(error);
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ employee_name, license_plates }: { employee_name: string; license_plates: string[] }) => {
      const { error } = await supabase
        .from('assigned_vehicles')
        .insert({ employee_name, license_plates });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assigned-vehicles'] });
      toast.success('Assignment created successfully');
      setIsAddingNew(false);
      setNewRow({ employee_name: '', license_plates: '' });
    },
    onError: (error) => {
      toast.error('Failed to create assignment');
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assigned_vehicles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assigned-vehicles'] });
      toast.success('Assignment deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete assignment');
      console.error(error);
    },
  });

  const handleEdit = (row: AssignedVehicle) => {
    setEditingRow({
      id: row.id,
      employee_name: row.employee_name,
      license_plates: row.license_plates.join(', '),
    });
  };

  const handleSave = () => {
    if (!editingRow) return;
    const plates = editingRow.license_plates.split(',').map((p) => p.trim()).filter(Boolean);
    if (!editingRow.employee_name.trim() || plates.length === 0) {
      toast.error('Please fill in all fields');
      return;
    }
    updateMutation.mutate({
      id: editingRow.id,
      employee_name: editingRow.employee_name.trim(),
      license_plates: plates,
    });
  };

  const handleCancel = () => {
    setEditingRow(null);
  };

  const handleAddNew = () => {
    const plates = newRow.license_plates.split(',').map((p) => p.trim()).filter(Boolean);
    if (!newRow.employee_name.trim() || plates.length === 0) {
      toast.error('Please fill in all fields');
      return;
    }
    createMutation.mutate({
      employee_name: newRow.employee_name.trim(),
      license_plates: plates,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Vehicle Assign Group
        </CardTitle>
        <Button
          size="sm"
          onClick={() => setIsAddingNew(true)}
          disabled={isAddingNew}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add Assignment
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>License Plates</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAddingNew && (
                  <TableRow>
                    <TableCell>
                      <Input
                        value={newRow.employee_name}
                        onChange={(e) => setNewRow((prev) => ({ ...prev, employee_name: e.target.value }))}
                        placeholder="Employee name"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newRow.license_plates}
                        onChange={(e) => setNewRow((prev) => ({ ...prev, license_plates: e.target.value }))}
                        placeholder="Plates (comma-separated)"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={handleAddNew} disabled={createMutation.isPending}>
                          <Save className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setIsAddingNew(false); setNewRow({ employee_name: '', license_plates: '' }); }}>
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {data?.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {editingRow?.id === row.id ? (
                        <Input
                          value={editingRow.employee_name}
                          onChange={(e) => setEditingRow((prev) => prev ? { ...prev, employee_name: e.target.value } : null)}
                        />
                      ) : (
                        row.employee_name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRow?.id === row.id ? (
                        <Input
                          value={editingRow.license_plates}
                          onChange={(e) => setEditingRow((prev) => prev ? { ...prev, license_plates: e.target.value } : null)}
                          placeholder="Comma-separated plates"
                        />
                      ) : (
                        row.license_plates.join(', ')
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRow?.id === row.id ? (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={handleSave} disabled={updateMutation.isPending}>
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleCancel}>
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(row)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(row.id)} disabled={deleteMutation.isPending}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!data || data.length === 0) && !isAddingNew && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No vehicle assignments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
