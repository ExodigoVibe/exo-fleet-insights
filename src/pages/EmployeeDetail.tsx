import { useState, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Shield,
  Mail,
  Phone,
  Key,
  FileText,
  AlertTriangle,
  Clock,
  Upload,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDriversQuery } from '@/hooks/queries/useDriversQuery';
import { useVehicleRequestsQuery } from '@/hooks/queries/useVehicleRequestsQuery';
import { useEventReportsQuery } from '@/hooks/queries/useEventReportsQuery';
import { useTripsQuery } from '@/hooks/queries/useTripsQuery';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EmployeeDetail() {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('car-usage');
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [isUploadingForm, setIsUploadingForm] = useState(false);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const formInputRef = useRef<HTMLInputElement>(null);

  // Default date range: last 30 days
  const dateTo = format(new Date(), 'yyyy-MM-dd');
  const dateFrom = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  const { data: drivers = [], isLoading: driversLoading } = useDriversQuery();
  const { data: requests = [], isLoading: requestsLoading, refetch: refetchRequests } = useVehicleRequestsQuery();
  const { data: eventReports = [], isLoading: eventsLoading } = useEventReportsQuery();
  const { data: tripsData, isLoading: tripsLoading } = useTripsQuery(dateFrom, dateTo);

  const trips = tripsData?.trips || [];
  const driver = drivers.find((d) => d.driver_id === Number(driverId));

  // Find vehicle requests for this employee by matching email or name
  const employeeRequests = requests.filter((req) => {
    if (!driver) return false;
    const driverFullName = `${driver.first_name} ${driver.last_name}`.toLowerCase();
    const requestFullName = req.full_name.toLowerCase();
    const emailMatch =
      driver.email && req.email && driver.email.toLowerCase() === req.email.toLowerCase();
    const nameMatch = driverFullName === requestFullName;
    return emailMatch || nameMatch;
  });

  // Find trips for this employee by matching driver code
  const employeeTrips = trips.filter((trip) => {
    if (!driver) return false;
    return trip.driver_code === driver.driver_code;
  });

  // Find event reports for this employee by matching name
  const employeeEvents = eventReports.filter((event) => {
    if (!driver) return false;
    const driverFullName = `${driver.first_name} ${driver.last_name}`.toLowerCase();
    const eventEmployeeName = event.employee_name.toLowerCase();
    return driverFullName === eventEmployeeName;
  });

  // Check if viewing own profile
  const isOwnProfile = useMemo(() => {
    if (!user || !driver) return false;
    const userEmail = user.email?.toLowerCase();
    const driverEmail = driver.email?.toLowerCase();
    return userEmail === driverEmail;
  }, [user, driver]);

  const canUpload = isOwnProfile || isAdmin;

  // Get documents from employee's vehicle requests
  const employeeDocuments = useMemo(() => {
    const licenseFiles: { url: string; requestId: string; date: string }[] = [];
    const signedForms: { url: string; requestId: string; date: string }[] = [];

    employeeRequests.forEach((request) => {
      if (request.license_file_url) {
        licenseFiles.push({
          url: request.license_file_url,
          requestId: request.id,
          date: request.created_at,
        });
      }
      if (request.signature_url) {
        signedForms.push({
          url: request.signature_url,
          requestId: request.id,
          date: request.signed_at || request.created_at,
        });
      }
    });

    return { licenseFiles, signedForms };
  }, [employeeRequests]);

  // Handle file upload for Driver's License
  const handleLicenseUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !driver) return;

    setIsUploadingLicense(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${driver.driver_id}_license_${Date.now()}.${fileExt}`;
      const filePath = `driver-licenses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-request-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-request-files')
        .getPublicUrl(filePath);

      // Find the latest request for this employee and update it
      const latestRequest = employeeRequests[0];
      if (latestRequest) {
        const { error: updateError } = await supabase
          .from('vehicle_requests')
          .update({ license_file_url: publicUrl })
          .eq('id', latestRequest.id);

        if (updateError) throw updateError;
      }

      toast.success('Driver license uploaded successfully');
      refetchRequests();
    } catch (error) {
      console.error('Error uploading license:', error);
      toast.error('Failed to upload driver license');
    } finally {
      setIsUploadingLicense(false);
      if (licenseInputRef.current) licenseInputRef.current.value = '';
    }
  };

  // Handle file upload for Signed Forms
  const handleFormUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !driver) return;

    setIsUploadingForm(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${driver.driver_id}_form_${Date.now()}.${fileExt}`;
      const filePath = `signed-forms/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-request-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-request-files')
        .getPublicUrl(filePath);

      // Find the latest request for this employee and update it
      const latestRequest = employeeRequests[0];
      if (latestRequest) {
        const { error: updateError } = await supabase
          .from('vehicle_requests')
          .update({ signature_url: publicUrl })
          .eq('id', latestRequest.id);

        if (updateError) throw updateError;
      }

      toast.success('Signed form uploaded successfully');
      refetchRequests();
    } catch (error) {
      console.error('Error uploading form:', error);
      toast.error('Failed to upload signed form');
    } finally {
      setIsUploadingForm(false);
      if (formInputRef.current) formInputRef.current.value = '';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending_manager':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_manager':
        return 'Pending Manager';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  if (driversLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading employee details...</div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="space-y-6 p-8">
        <Button variant="outline" onClick={() => navigate('/employees')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Button>
        <div className="text-center text-muted-foreground">Employee not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/employees')}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          Profile for {driver.first_name}.{driver.last_name}
        </h1>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee ID */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="text-base font-medium">{driver.driver_id}</p>
              </div>
            </div>

            {/* Driver Code */}
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Driver Code</p>
                <p className="text-base font-medium">{driver.driver_code || '-'}</p>
              </div>
            </div>

            {/* Name */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="text-base font-medium">
                  {driver.first_name} {driver.last_name}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {driver.is_blocked ? (
                  <Badge variant="destructive" className="mt-1">
                    Blocked
                  </Badge>
                ) : (
                  <Badge className="bg-green-600 mt-1">Active</Badge>
                )}
              </div>
            </div>

            {/* Email Address */}
            {driver.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <a
                    href={`mailto:${driver.email}`}
                    className="text-base font-medium text-blue-600 hover:underline"
                  >
                    {driver.email}
                  </a>
                </div>
              </div>
            )}

            {/* Phone Number */}
            {(driver.phone || driver.cellular) && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <a
                    href={`tel:${driver.phone || driver.cellular}`}
                    className="text-base font-medium text-blue-600 hover:underline"
                  >
                    {driver.phone || driver.cellular}
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Access */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Key className="h-5 w-5" />
            Vehicle Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Driver Code (Ituran)</p>
              <p className="text-2xl font-bold text-primary">
                {driver.driver_code || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Driver's License */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-primary">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Driver's License
            </div>
            {canUpload && (
              <>
                <input
                  type="file"
                  ref={licenseInputRef}
                  onChange={handleLicenseUpload}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => licenseInputRef.current?.click()}
                  disabled={isUploadingLicense}
                >
                  {isUploadingLicense ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employeeDocuments.licenseFiles.length > 0 ? (
            <div className="space-y-3">
              {employeeDocuments.licenseFiles.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Driver's License</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded: {format(new Date(doc.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No driver license information on file.</p>
          )}
        </CardContent>
      </Card>

      {/* Signed Forms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-primary">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Signed Forms
            </div>
            {canUpload && (
              <>
                <input
                  type="file"
                  ref={formInputRef}
                  onChange={handleFormUpload}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => formInputRef.current?.click()}
                  disabled={isUploadingForm}
                >
                  {isUploadingForm ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employeeDocuments.signedForms.length > 0 ? (
            <div className="space-y-3">
              {employeeDocuments.signedForms.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Signed Form</p>
                      <p className="text-xs text-muted-foreground">
                        Signed: {format(new Date(doc.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No signed forms found for this employee.</p>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Clock className="h-5 w-5" />
            History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="car-usage">Car Usage ({employeeTrips.length})</TabsTrigger>
              <TabsTrigger value="requests">Requests ({employeeRequests.length})</TabsTrigger>
              <TabsTrigger value="events">Events ({employeeEvents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-4">
              {requestsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
              ) : employeeRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No requests found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeRequests.map((request) => (
                      <TableRow
                        key={request.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/requests/${request.id}`)}
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-200"
                          >
                            {request.usage_type === 'single_use'
                              ? 'Single Use'
                              : 'Permanent Driver'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.start_date), 'MMM dd, yyyy')}
                          {request.end_date &&
                            ` - ${format(new Date(request.end_date), 'MMM dd, yyyy')}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadgeColor(request.status)}>
                            {getStatusLabel(request.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="car-usage" className="mt-4">
              {tripsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading car usage...</div>
              ) : employeeTrips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No car usage found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Distance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeTrips.slice(0, 10).map((trip) => (
                      <TableRow key={trip.trip_id}>
                        <TableCell className="font-medium">{trip.license_plate}</TableCell>
                        <TableCell>
                          {format(new Date(trip.start_location.timestamp), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{Math.round(trip.duration_in_seconds / 60)} min</TableCell>
                        <TableCell>
                          {trip.distance ? `${trip.distance.toFixed(1)} km` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="events" className="mt-4">
              {eventsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading events...</div>
              ) : employeeEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No events found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeEvents.map((event) => (
                      <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              event.severity === 'extensive'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }
                          >
                            {event.severity === 'extensive' ? 'Extensive' : 'Slight'} Damage
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(event.event_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              event.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : event.status === 'reviewed'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                            }
                          >
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
