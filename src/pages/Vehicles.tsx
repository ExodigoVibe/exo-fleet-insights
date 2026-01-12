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
    'all' | 'parking' | 'assigned' | 'driving' | 'other'
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Build a map of license plate to driver name from vehicle_assignments (new table)
  const newAssignmentMap = useMemo(() => {
    const map = new Map<string, string>();
    vehicleAssignments?.forEach((assignment) => {
      if (assignment.driver_name) {
        map.set(assignment.license_plate, assignment.driver_name);
      }
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
    return newAssignmentMap.get(licensePlate) || legacyAssignmentMap.get(licensePlate) || null;
  };

  // Get all assigned license plates (from both tables)
  const assignedLicensePlates = useMemo(() => {
    const plates = new Set<string>();
    // From new vehicle_assignments table
    vehicleAssignments?.forEach((assignment) => {
      if (assignment.driver_id) {
        plates.add(assignment.license_plate);
      }
    });
    // From legacy assigned_vehicles table
    assignedVehiclesData?.forEach((assignment) => {
      assignment.license_plates.forEach((plate) => plates.add(plate));
    });
    return plates;
  }, [vehicleAssignments, assignedVehiclesData]);

  // Read filter from URL on mount
  useEffect(() => {
    const filterParam = searchParams.get('filter') as
      | 'all'
      | 'parking'
      | 'assigned'
      | 'driving'
      | 'other';
    if (filterParam && ['all', 'parking', 'assigned', 'driving', 'other'].includes(filterParam)) {
      setStatusFilter(filterParam);
    }
  }, [searchParams]);

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];

    let filtered = vehicles;

    // Apply status filter
    if (statusFilter === 'parking') {
      // Available = parking AND not assigned
      filtered = filtered.filter(
        (v) => v.motion_status?.toLowerCase() === 'parking' && !assignedLicensePlates.has(v.license_plate)
      );
    } else if (statusFilter === 'driving') {
      filtered = filtered.filter((v) => v.motion_status?.toLowerCase() === 'driving');
    } else if (statusFilter === 'assigned') {
      // Show only vehicles that are in the assigned_vehicles database
      filtered = filtered.filter((v) => assignedLicensePlates.has(v.license_plate));
    } else if (statusFilter === 'other') {
      // Show all vehicles that are NOT parking or driving
      filtered = filtered.filter((v) => {
        const status = v.motion_status?.toLowerCase();
        return status !== 'parking' && status !== 'driving';
      });
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
  }, [vehicles, searchTerm, statusFilter, assignedLicensePlates]);

  // Calculate KPIs
  const totalVehicles = vehicles?.length || 0;
  const availableVehicles =
    vehicles?.filter((v) => v.motion_status?.toLowerCase() === 'parking' && !assignedLicensePlates.has(v.license_plate))?.length || 0;
  const assignedVehiclesCount = assignedLicensePlates.size;
  const drivingVehicles =
    vehicles?.filter((v) => v.motion_status?.toLowerCase() === 'driving')?.length || 0;
  const maintenanceVehicles =
    vehicles?.filter((v) => {
      const status = v.motion_status?.toLowerCase();
      return status !== 'parking' && status !== 'driving';
    })?.length || 0;

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
              className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'parking' ? 'border-2 border-primary' : ''}`}
              onClick={() => setStatusFilter('parking')}
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
              className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'other' ? 'border-2 border-primary' : ''}`}
              onClick={() => setStatusFilter('other')}
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
                  : statusFilter === 'parking'
                    ? 'Available Vehicles'
                    : statusFilter === 'assigned'
                      ? 'Assigned Vehicles'
                      : statusFilter === 'driving'
                        ? 'Driving Vehicles'
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
                            {assignedTo ? (
                              <Badge variant="default" className="bg-blue-600">Assigned</Badge>
                            ) : (
                              getStatusBadge(vehicle.motion_status)
                            )}
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
