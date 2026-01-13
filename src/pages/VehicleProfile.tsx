import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Gauge,
  Settings,
  Car,
  FileText,
  Wrench,
  History,
  Loader2,
  Check,
  ChevronsUpDown,
  CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { useVehiclesQuery } from '@/hooks/queries/useVehiclesQuery';
import { useDriversQuery } from '@/hooks/queries/useDriversQuery';
import {
  useVehicleDocumentsQuery,
  useUpsertVehicleDocument,
} from '@/hooks/queries/useVehicleDocumentsQuery';
import { useVehicleOdometerQuery } from '@/hooks/queries/useVehicleOdometerQuery';
import { useVehicleTripsQuery } from '@/hooks/queries/useVehicleTripsQuery';
import {
  useVehicleAssignmentByPlateQuery,
  useUpsertVehicleAssignment,
} from '@/hooks/queries/useVehicleAssignmentsQuery';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function VehicleProfile() {
  const { licensePlate } = useParams<{ licensePlate: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Set up real-time subscription for vehicle_information
  useEffect(() => {
    if (!licensePlate) return;

    const channel = supabase
      .channel('vehicle-information-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_information',
          filter: `license_plate=eq.${licensePlate}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['vehicle-documents', licensePlate] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [licensePlate, queryClient]);

  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehiclesQuery();
  const { data: drivers = [], isLoading: driversLoading } = useDriversQuery();
  const { data: documents = [], isLoading: documentsLoading } = useVehicleDocumentsQuery(
    licensePlate || '',
  );
  const { data: currentOdometer, isLoading: odometerLoading } = useVehicleOdometerQuery(
    licensePlate || '',
  );
  const { data: vehicleTrips = [], isLoading: tripsLoading } = useVehicleTripsQuery(
    licensePlate || '',
  );
  const { data: existingAssignment, isLoading: assignmentLoading } =
    useVehicleAssignmentByPlateQuery(licensePlate || '');
  const upsertDocument = useUpsertVehicleDocument();
  const upsertAssignment = useUpsertVehicleAssignment();

  const [assignment, setAssignment] = useState('');
  const [assignmentDropdownOpen, setAssignmentDropdownOpen] = useState(false);
  const [status, setStatus] = useState('available');
  const [assignmentStartDate, setAssignmentStartDate] = useState<Date | undefined>(undefined);
  const [assignmentEndDate, setAssignmentEndDate] = useState<Date | undefined>(undefined);

  // Document states
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [licenseReminderEnabled, setLicenseReminderEnabled] = useState(false);
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
  const [insuranceReminderEnabled, setInsuranceReminderEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Service info states
  const [nextServiceMileage, setNextServiceMileage] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [isEditingService, setIsEditingService] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);

  // Load existing assignment data
  useEffect(() => {
    if (existingAssignment) {
      setAssignment(existingAssignment.driver_id || 'unassigned');
      setStatus(existingAssignment.status);
      if (existingAssignment.start_date) {
        setAssignmentStartDate(new Date(existingAssignment.start_date));
      }
      if (existingAssignment.end_date) {
        setAssignmentEndDate(new Date(existingAssignment.end_date));
      }
    }
  }, [existingAssignment]);

  // Load document data when fetched
  useEffect(() => {
    if (documents.length > 0) {
      const licenseDoc = documents.find((d) => d.document_type === 'license');
      const insuranceDoc = documents.find((d) => d.document_type === 'insurance');
      const serviceDoc = documents.find((d) => d.document_type === 'service');

      if (licenseDoc) {
        setLicenseExpiryDate(licenseDoc.expiry_date);
        setLicenseReminderEnabled(licenseDoc.email_reminder_enabled);
      }
      if (insuranceDoc) {
        setInsuranceExpiryDate(insuranceDoc.expiry_date);
        setInsuranceReminderEnabled(insuranceDoc.email_reminder_enabled);
      }
      if (serviceDoc) {
        setNextServiceMileage(serviceDoc.next_service_mileage?.toString() || '');
        setLastServiceDate(serviceDoc.last_service_date || '');
      }
    }
  }, [documents]);

  const vehicle = vehicles.find((v) => v.license_plate === licensePlate);

  const isDocumentExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isDocumentExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    return expiry >= today && expiry <= oneMonthFromNow;
  };

  const handleSaveDocuments = async () => {
    if (!licensePlate) return;

    setIsSaving(true);
    try {
      const promises = [];

      if (licenseExpiryDate) {
        promises.push(
          upsertDocument.mutateAsync({
            license_plate: licensePlate,
            document_type: 'license',
            expiry_date: licenseExpiryDate,
            email_reminder_enabled: licenseReminderEnabled,
          }),
        );
      }

      if (insuranceExpiryDate) {
        promises.push(
          upsertDocument.mutateAsync({
            license_plate: licensePlate,
            document_type: 'insurance',
            expiry_date: insuranceExpiryDate,
            email_reminder_enabled: insuranceReminderEnabled,
          }),
        );
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Error saving documents:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveServiceInfo = async () => {
    if (!licensePlate) return;

    setIsSavingService(true);
    try {
      await upsertDocument.mutateAsync({
        license_plate: licensePlate,
        document_type: 'service',
        next_service_mileage: nextServiceMileage ? parseInt(nextServiceMileage) : null,
        last_service_date: lastServiceDate || null,
      });
      setIsEditingService(false);
    } catch (error) {
      console.error('Error saving service info:', error);
    } finally {
      setIsSavingService(false);
    }
  };

  if (vehiclesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading vehicle details...</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6 p-8">
        <Button variant="outline" onClick={() => navigate('/vehicle-fleet')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Vehicle Fleet
        </Button>
        <div className="text-center text-muted-foreground">Vehicle not found</div>
      </div>
    );
  }

  const vehicleTitle = `${vehicle.make_name} ${vehicle.model_name}`;
  const assignedDriver = drivers.find((d) => d.driver_id.toString() === assignment);
  const assignmentLabel =
    assignment === 'unassigned'
      ? 'Unassigned'
      : assignedDriver
        ? `${assignedDriver.first_name} ${assignedDriver.last_name}`
        : '';

  const handleApplyAssignment = async () => {
    if (!licensePlate || !assignmentStartDate) {
      toast.error('Please select a start date');
      return;
    }

    const driverName = assignedDriver
      ? `${assignedDriver.first_name} ${assignedDriver.last_name}`
      : null;

    await upsertAssignment.mutateAsync({
      license_plate: licensePlate,
      driver_id: assignment === 'unassigned' ? null : assignment,
      driver_name: assignment === 'unassigned' ? null : driverName,
      status,
      start_date: format(assignmentStartDate, 'yyyy-MM-dd'),
      end_date: assignmentEndDate ? format(assignmentEndDate, 'yyyy-MM-dd') : null,
      assigned_by_id: user?.id || null,
      assigned_by_name: user?.name || user?.email || null,
    });
  };

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/vehicle-fleet')}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Vehicle Profile: {vehicleTitle}</h1>
      </div>

      {/* Top Section: Assignment, Dates, Status, Apply */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Vehicle Assignment & Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Assignment */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Assignment
              </Label>
              <Popover open={assignmentDropdownOpen} onOpenChange={setAssignmentDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={assignmentDropdownOpen}
                    className="w-full justify-between"
                    disabled={driversLoading}
                  >
                    {assignmentLabel || 'Select driver'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search driver..." />
                    <CommandList>
                      <CommandEmpty>No driver found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="unassigned"
                          onSelect={() => {
                            setAssignment('unassigned');
                            setAssignmentDropdownOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              assignment === 'unassigned' ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          Unassigned
                        </CommandItem>

                        {driversLoading ? (
                          <CommandItem disabled value="loading">
                            Loading...
                          </CommandItem>
                        ) : (
                          drivers.map((driver) => {
                            const id = driver.driver_id.toString();
                            const label = `${driver.first_name} ${driver.last_name}`;
                            const searchValue = `${label} ${driver.email || ''} ${driver.managed_code || ''}`;

                            return (
                              <CommandItem
                                key={driver.driver_id}
                                value={searchValue}
                                onSelect={() => {
                                  setAssignment(id);
                                  setAssignmentDropdownOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    assignment === id ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                {label}
                              </CommandItem>
                            );
                          })
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <CalendarIcon className="h-4 w-4" />
                Assignment Dates
              </Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !assignmentStartDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {assignmentStartDate ? format(assignmentStartDate, 'dd/MM/yy') : 'From'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={assignmentStartDate}
                      onSelect={setAssignmentStartDate}
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !assignmentEndDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {assignmentEndDate ? format(assignmentEndDate, 'dd/MM/yy') : 'To'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={assignmentEndDate}
                      onSelect={setAssignmentEndDate}
                      disabled={(date) =>
                        assignmentStartDate ? date < assignmentStartDate : false
                      }
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Settings className="h-4 w-4" />
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Apply Button */}
            <div className="space-y-2">
              <Label className="text-sm font-medium invisible">Apply</Label>
              <Button
                className="w-full"
                onClick={handleApplyAssignment}
                disabled={upsertAssignment.isPending || !assignmentStartDate}
              >
                {upsertAssignment.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
          </div>

          {assignedDriver && assignmentStartDate && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
              <strong>{vehicle.license_plate}</strong> is assigned to{' '}
              <strong>
                {assignedDriver.first_name} {assignedDriver.last_name}
              </strong>{' '}
              from <strong>{format(assignmentStartDate, 'dd/MM/yyyy')}</strong>
              {assignmentEndDate && (
                <>
                  {' '}
                  to <strong>{format(assignmentEndDate, 'dd/MM/yyyy')}</strong>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mileage Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <Gauge className="h-4 w-4" />
            Current Mileage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold">
              {odometerLoading ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              ) : currentOdometer ? (
                `${currentOdometer.toLocaleString()}`
              ) : (
                'N/A'
              )}
            </div>
            <div className="text-sm text-muted-foreground">kilometers</div>
          </div>
        </CardContent>
      </Card>

      {/* Car Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Car Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Car Name</p>
              <p className="text-base font-semibold">{vehicleTitle}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">License Plate</p>
              <p className="text-base font-semibold">{vehicle.license_plate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Model & Year</p>
              <p className="text-base font-semibold">
                {vehicle.model_name} {vehicle.model_year}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Arrival Date</p>
              <p className="text-base font-semibold">-</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Contract End</p>
              <p className="text-base font-semibold">-</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Monthly Cost</p>
              <p className="text-base font-semibold">$N/A</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Car Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Car Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vehicle License */}
          <div className="space-y-3">
            <Label>Vehicle License</Label>
            <div className="flex gap-3">
              <Input type="file" className="flex-1" />
              <Input
                type="date"
                className="w-48"
                value={licenseExpiryDate}
                onChange={(e) => setLicenseExpiryDate(e.target.value)}
              />
            </div>
            {licenseExpiryDate && isDocumentExpired(licenseExpiryDate) && (
              <div className="text-sm text-red-600 flex items-center gap-2">
                <span>⚠</span>
                <span>Document has expired.</span>
              </div>
            )}
            {licenseExpiryDate &&
              isDocumentExpiringSoon(licenseExpiryDate) &&
              !isDocumentExpired(licenseExpiryDate) && (
                <div className="text-sm text-amber-600 flex items-center gap-2">
                  <span>⚠</span>
                  <span>Document expires within 1 month.</span>
                </div>
              )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="email-reminder-license"
                checked={licenseReminderEnabled}
                onCheckedChange={(checked) => setLicenseReminderEnabled(checked === true)}
              />
              <label htmlFor="email-reminder-license" className="text-sm">
                Email reminder 1 month before expiry
              </label>
            </div>
          </div>

          {/* Vehicle Insurance */}
          <div className="space-y-3">
            <Label>Vehicle Insurance</Label>
            <div className="flex gap-3">
              <Input type="file" className="flex-1" />
              <Input
                type="date"
                className="w-48"
                value={insuranceExpiryDate}
                onChange={(e) => setInsuranceExpiryDate(e.target.value)}
              />
            </div>
            {insuranceExpiryDate && isDocumentExpired(insuranceExpiryDate) && (
              <div className="text-sm text-red-600 flex items-center gap-2">
                <span>⚠</span>
                <span>Document has expired.</span>
              </div>
            )}
            {insuranceExpiryDate &&
              isDocumentExpiringSoon(insuranceExpiryDate) &&
              !isDocumentExpired(insuranceExpiryDate) && (
                <div className="text-sm text-amber-600 flex items-center gap-2">
                  <span>⚠</span>
                  <span>Document expires within 1 month.</span>
                </div>
              )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="email-reminder-insurance"
                checked={insuranceReminderEnabled}
                onCheckedChange={(checked) => setInsuranceReminderEnabled(checked === true)}
              />
              <label htmlFor="email-reminder-insurance" className="text-sm">
                Email reminder 1 month before expiry
              </label>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSaveDocuments}
            disabled={isSaving || !licenseExpiryDate || !insuranceExpiryDate}
          >
            {isSaving ? 'Saving...' : 'Save Documents'}
          </Button>
          {(!licenseExpiryDate || !insuranceExpiryDate) && (
            <p className="text-sm text-muted-foreground text-center">
              Both Vehicle License and Insurance expiry dates are required to save.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Service Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Service Information</CardTitle>
          {isAdmin && !isEditingService && (
            <Button variant="outline" size="sm" onClick={() => setIsEditingService(true)}>
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Mileage</p>
              <p className="text-2xl font-bold">
                {odometerLoading ? (
                  <Loader2 className="h-10 w-10 animate-spin text-primary ml-7" />
                ) : currentOdometer ? (
                  `${currentOdometer.toLocaleString()} km`
                ) : (
                  'N/A'
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Mileage to Next Service</p>
              {isEditingService ? (
                <Input
                  type="number"
                  placeholder="Enter target mileage"
                  value={nextServiceMileage}
                  onChange={(e) => setNextServiceMileage(e.target.value)}
                  className="text-lg"
                />
              ) : (
                <p className="text-2xl font-bold">
                  {currentOdometer && nextServiceMileage
                    ? `${(parseInt(nextServiceMileage) - currentOdometer).toLocaleString()} km`
                    : 'N/A'}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Last Service Date</p>
              {isEditingService ? (
                <Input
                  type="date"
                  value={lastServiceDate}
                  onChange={(e) => setLastServiceDate(e.target.value)}
                  className="text-lg"
                />
              ) : (
                <p className="text-2xl font-bold">
                  {lastServiceDate ? format(new Date(lastServiceDate), 'dd/MM/yyyy') : 'N/A'}
                </p>
              )}
            </div>
          </div>
          {isEditingService && (
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingService(false);
                  // Reset to original values from documents
                  const serviceDoc = documents.find((d) => d.document_type === 'service');
                  setNextServiceMileage(serviceDoc?.next_service_mileage?.toString() || '');
                  setLastServiceDate(serviceDoc?.last_service_date || '');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveServiceInfo} disabled={isSavingService}>
                {isSavingService ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Maintenance History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No maintenance history found
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Car History - Trips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Car History - Previous Trips</CardTitle>
        </CardHeader>
        <CardContent>
          {tripsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : vehicleTrips && vehicleTrips.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleTrips.slice(0, 20).map((trip) => (
                  <TableRow key={trip.trip_id}>
                    <TableCell className="text-sm">
                      {format(new Date(trip.start_location.timestamp), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm">{trip.driver_name}</TableCell>
                    <TableCell className="text-sm truncate max-w-[150px]">
                      {trip.start_location.location.address.location || '-'}
                    </TableCell>
                    <TableCell className="text-sm truncate max-w-[150px]">
                      {trip.end_location.location.address.location || '-'}
                    </TableCell>
                    <TableCell className="text-sm">{trip.distance.toFixed(1)} km</TableCell>
                    <TableCell className="text-sm">
                      {Math.round(trip.duration_in_seconds / 60)} min
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">No trip history found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
