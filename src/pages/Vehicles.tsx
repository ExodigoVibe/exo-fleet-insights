import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVehiclesQuery } from '@/hooks/queries/useVehiclesQuery';
import { useAssignedVehiclesQuery } from '@/hooks/queries/useAssignedVehiclesQuery';
import { useVehicleAssignmentsQuery } from '@/hooks/queries/useVehicleAssignmentsQuery';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Car, Search, Download, Plus, Wrench, Users, Circle, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const Vehicles = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: vehicles, isLoading, error } = useVehiclesQuery();
  const { data: assignedVehiclesData } = useAssignedVehiclesQuery();
  const { data: vehicleAssignments } = useVehicleAssignmentsQuery();
  const { hasAdminAccess } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'available' | 'assigned' | 'maintenance'
  >('all');

  // Subscribe to real-time updates for vehicle_assignments
  useEffect(() => {
    const channel = supabase
      .channel('vehicle-assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_assignments',
        },
        () => {
          // Invalidate the query to refetch data
          queryClient.invalidateQueries({ queryKey: ['vehicle-assignments'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Build a map of license plate to assignment info from vehicle_assignments (new table)
  const vehicleAssignmentMap = useMemo(() => {
    const map = new Map<string, { driverName: string | null; status: string }>();
    vehicleAssignments?.forEach((assignment) => {
      map.set(assignment.license_plate, {
        driverName: assignment.driver_name || null,
        status: assignment.status || 'available',
      });
    });
    return map;
  }, [vehicleAssignments]);

  // Build a map of license plate to employee name for assignments (legacy table)
  const legacyAssignmentMap = useMemo(() => {
    const map = new Map<string, string>();
    assignedVehiclesData?.forEach((assignment) => {
      assignment.license_plates.forEach((plate) => {
        map.set(plate, assignment.employee_name);
      });
    });
    return map;
  }, [assignedVehiclesData]);

  // Get assignment for a license plate - prioritize new table, fallback to legacy
  const getAssignmentName = (licensePlate: string): string | null => {
    const newAssignment = vehicleAssignmentMap.get(licensePlate);
    if (newAssignment?.driverName) return newAssignment.driverName;
    return legacyAssignmentMap.get(licensePlate) || null;
  };

  // Get the effective status for a vehicle
  // Priority: explicit status (maintenance) > assigned/available based on driver
  const getVehicleStatus = (licensePlate: string): 'available' | 'assigned' | 'maintenance' => {
    const assignment = vehicleAssignmentMap.get(licensePlate);
    
    // If there's an explicit status like "maintenance", it takes priority
    if (assignment?.status?.toLowerCase() === 'maintenance') {
      return 'maintenance';
    }
    
    // Check if driver is assigned (from new table or legacy table)
    const hasDriver = assignment?.driverName || legacyAssignmentMap.has(licensePlate);
    return hasDriver ? 'assigned' : 'available';
  };

  // Get vehicles by calculated status
  const vehiclesByStatus = useMemo(() => {
    const available: string[] = [];
    const assigned: string[] = [];
    const maintenance: string[] = [];

    vehicles?.forEach((vehicle) => {
      const status = getVehicleStatus(vehicle.license_plate);
      if (status === 'maintenance') {
        maintenance.push(vehicle.license_plate);
      } else if (status === 'assigned') {
        assigned.push(vehicle.license_plate);
      } else {
        available.push(vehicle.license_plate);
      }
    });

    return { available, assigned, maintenance };
  }, [vehicles, vehicleAssignmentMap, legacyAssignmentMap]);

  // Read filter from URL on mount
  useEffect(() => {
    const filterParam = searchParams.get('filter') as
      | 'all'
      | 'available'
      | 'assigned'
      | 'maintenance';
    if (filterParam && ['all', 'available', 'assigned', 'maintenance'].includes(filterParam)) {
      setStatusFilter(filterParam);
    }
  }, [searchParams]);

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];

    let filtered = vehicles;

    // Apply status filter based on calculated status
    if (statusFilter === 'available') {
      filtered = filtered.filter((v) => vehiclesByStatus.available.includes(v.license_plate));
    } else if (statusFilter === 'assigned') {
      filtered = filtered.filter((v) => vehiclesByStatus.assigned.includes(v.license_plate));
    } else if (statusFilter === 'maintenance') {
      filtered = filtered.filter((v) => vehiclesByStatus.maintenance.includes(v.license_plate));
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((vehicle) => {
        const licensePlate = vehicle.license_plate?.toLowerCase() || '';
        const nickname = vehicle.nickname?.toLowerCase() || '';
        const make = vehicle.make_name?.toLowerCase() || '';
        const model = vehicle.model_name?.toLowerCase() || '';
        const year = vehicle.model_year?.toString() || '';

        return (
          licensePlate.includes(search) ||
          nickname.includes(search) ||
          make.includes(search) ||
          model.includes(search) ||
          year.includes(search)
        );
      });
    }

    return filtered;
  }, [vehicles, searchTerm, statusFilter, vehiclesByStatus]);

  // Calculate KPIs
  const totalVehicles = vehicles?.length || 0;
  const availableVehicles = vehiclesByStatus.available.length;
  const assignedVehiclesCount = vehiclesByStatus.assigned.length;
  const maintenanceVehicles = vehiclesByStatus.maintenance.length;

  const handleExportToExcel = () => {
    if (!filteredVehicles.length) {
      toast.error('No data to export');
      return;
    }

    const exportData = filteredVehicles.map((vehicle) => ({
      'License Plate': vehicle.license_plate,
      'Model & Year': `${vehicle.make_name} ${vehicle.model_name} ${vehicle.model_year}`,
      'Car Name': vehicle.nickname || '-',
      VIN: vehicle.vin || '-',
      Color: vehicle.color || '-',
      Status: vehicle.motion_status || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicles');

    XLSX.writeFile(workbook, `vehicles_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${filteredVehicles.length} vehicles to Excel`);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'parking':
        return <Badge variant="success">Available</Badge>;
      case 'driving':
        return <Badge variant="driving">Driving</Badge>;
      case 'maintenance':
        return <Badge variant="warning">Maintenance</Badge>;
      case 'moving':
        return <Badge variant="driving">In Use</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vehicle Fleet</h1>
            <p className="text-muted-foreground mt-1">
              Manage company vehicles and track usage history
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportToExcel}
              disabled={isLoading || !filteredVehicles.length}
              variant="outline"
              className="gap-2"
            >
              Excel <Download className="h-4 w-4" />
            </Button>
            <Button className="gap-2 bg-primary">
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* KPI Cards - Only visible to admins and coordinators */}
        {hasAdminAccess && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'all' ? 'border-2 border-primary' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              <CardContent className="pt-6 text-center">
                <Car className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-4xl font-bold mb-1">{totalVehicles}</div>
                <div className="text-sm text-muted-foreground">Total Vehicles</div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'available' ? 'border-2 border-primary' : ''}`}
              onClick={() => setStatusFilter('available')}
            >
              <CardContent className="pt-6 text-center">
                <div className="h-8 w-8 rounded-full bg-emerald-500 mx-auto mb-3 flex items-center justify-center">
                  <Circle className="h-4 w-4 text-white fill-white" />
                </div>
                <div className="text-4xl font-bold text-emerald-600 mb-1">{availableVehicles}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'assigned' ? 'border-2 border-primary' : ''}`}
              onClick={() => setStatusFilter('assigned')}
            >
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <div className="text-4xl font-bold text-blue-600 mb-1">{assignedVehiclesCount}</div>
                <div className="text-sm text-muted-foreground">Assigned</div>
              </CardContent>
            </Card>

            {/* <Card
              className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'driving' ? 'border-2 border-primary' : ''}`}
              onClick={() => setStatusFilter('driving')}
            >
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-3 flex items-center justify-center">
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
                <div className="text-4xl font-bold text-blue-600 mb-1">{drivingVehicles}</div>
                <div className="text-sm text-muted-foreground">Driving</div>
              </CardContent>
            </Card> */}

            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'maintenance' ? 'border-2 border-primary' : ''}`}
              onClick={() => setStatusFilter('maintenance')}
            >
              <CardContent className="pt-6 text-center">
                <Wrench className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                <div className="text-4xl font-bold text-amber-600 mb-1">{maintenanceVehicles}</div>
                <div className="text-sm text-muted-foreground">Maintenance</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search vehicles by license plate, manufacturer, or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicles Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Car className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">
                {statusFilter === 'all'
                  ? 'All Vehicles'
                  : statusFilter === 'available'
                    ? 'Available Vehicles'
                    : statusFilter === 'assigned'
                      ? 'Assigned Vehicles'
                      : 'Maintenance Vehicles'}{' '}
                ({filteredVehicles.length})
              </h2>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-muted-foreground">
                Failed to load vehicles data
              </div>
            ) : filteredVehicles.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>License Plate</TableHead>
                      <TableHead>Model & Year</TableHead>
                      <TableHead>Car Name</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Current Mileage</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map((vehicle) => {
                      const assignedTo = getAssignmentName(vehicle.license_plate);
                      return (
                        <TableRow
                          key={vehicle.vehicle_id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/vehicle/${vehicle.license_plate}`)}
                        >
                          <TableCell className="font-medium">{vehicle.license_plate}</TableCell>
                          <TableCell>
                            {vehicle.make_name} {vehicle.model_year}
                          </TableCell>
                          <TableCell>
                            {vehicle.make_name} {vehicle.model_name}
                          </TableCell>
                          <TableCell>
                            {assignedTo ? (
                              <span className="font-medium text-blue-600">{assignedTo}</span>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>{vehicle.color || '-'}</TableCell>
                          <TableCell>
                            {(() => {
                              const status = getVehicleStatus(vehicle.license_plate);
                              if (status === 'maintenance') {
                                return <Badge variant="warning">Maintenance</Badge>;
                              } else if (status === 'assigned') {
                                return (
                                  <Badge variant="default" className="bg-blue-600">
                                    Assigned
                                  </Badge>
                                );
                              } else {
                                return <Badge variant="success">Available</Badge>;
                              }
                            })()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : searchTerm ? (
              <div className="text-center py-8 text-muted-foreground">
                No vehicles matching "{searchTerm}"
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No vehicles found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Vehicles;
