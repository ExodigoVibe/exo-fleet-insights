import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User, Shield, Mail, Phone, Key, FileText, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDriversQuery } from "@/hooks/queries/useDriversQuery";
import { useVehicleRequestsQuery } from "@/hooks/queries/useVehicleRequestsQuery";
import { useEventReportsQuery } from "@/hooks/queries/useEventReportsQuery";
import { useTripsQuery } from "@/hooks/queries/useTripsQuery";
import { format } from "date-fns";

export default function EmployeeDetail() {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("requests");
  
  // Default date range: last 30 days
  const dateTo = format(new Date(), "yyyy-MM-dd");
  const dateFrom = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
  
  const { data: drivers = [], isLoading: driversLoading } = useDriversQuery();
  const { data: requests = [], isLoading: requestsLoading } = useVehicleRequestsQuery();
  const { data: eventReports = [], isLoading: eventsLoading } = useEventReportsQuery();
  const { data: tripsData, isLoading: tripsLoading } = useTripsQuery(dateFrom, dateTo);

  const trips = tripsData?.trips || [];
  const driver = drivers.find((d) => d.driver_id === Number(driverId));

  // Find vehicle requests for this employee by matching email or name
  const employeeRequests = requests.filter((req) => {
    if (!driver) return false;
    const driverFullName = `${driver.first_name} ${driver.last_name}`.toLowerCase();
    const requestFullName = req.full_name.toLowerCase();
    const emailMatch = driver.email && req.email && driver.email.toLowerCase() === req.email.toLowerCase();
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending_manager":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "approved":
        return "bg-green-50 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_manager":
        return "Pending Manager";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
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
        <Button variant="outline" onClick={() => navigate("/employees")} className="gap-2">
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
          onClick={() => navigate("/employees")}
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
                <p className="text-base font-medium">{driver.driver_code || "-"}</p>
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
                  <Badge variant="destructive" className="mt-1">Blocked</Badge>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Key className="h-5 w-5" />
            Vehicle Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading vehicle access history...
            </div>
          ) : employeeRequests.length === 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">No Active or Past Requests</p>
                  <p className="text-sm text-red-700">
                    This employee has no vehicle access history.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {employeeRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/requests/${request.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {request.usage_type === "single_use" ? "Single Use" : "Permanent Driver"}
                        </Badge>
                        <Badge variant="outline" className={getStatusBadgeColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.start_date), "MMM dd, yyyy")}
                        {request.end_date && ` - ${format(new Date(request.end_date), "MMM dd, yyyy")}`}
                      </p>
                      {request.purpose && (
                        <p className="text-sm mt-1">{request.purpose}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver's License */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            Driver's License
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No driver license information on file.</p>
        </CardContent>
      </Card>

      {/* Signed Forms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            Signed Forms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No signed forms found for this employee.</p>
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
              <TabsTrigger value="requests">
                Requests ({employeeRequests.length})
              </TabsTrigger>
              <TabsTrigger value="car-usage">
                Car Usage ({employeeTrips.length})
              </TabsTrigger>
              <TabsTrigger value="events">
                Events ({employeeEvents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-4">
              {requestsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading requests...
                </div>
              ) : employeeRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No requests found
                </div>
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
                            {request.usage_type === "single_use" ? "Single Use" : "Permanent Driver"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.start_date), "MMM dd, yyyy")}
                          {request.end_date && ` - ${format(new Date(request.end_date), "MMM dd, yyyy")}`}
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
                <div className="text-center py-8 text-muted-foreground">
                  Loading car usage...
                </div>
              ) : employeeTrips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No car usage found
                </div>
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
                          {format(new Date(trip.start_location.timestamp), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          {Math.round(trip.duration_in_seconds / 60)} min
                        </TableCell>
                        <TableCell>
                          {trip.distance ? `${trip.distance.toFixed(1)} km` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="events" className="mt-4">
              {eventsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading events...
                </div>
              ) : employeeEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No events found
                </div>
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
                              event.severity === "extensive"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }
                          >
                            {event.severity === "extensive" ? "Extensive" : "Slight"} Damage
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(event.event_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              event.status === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : event.status === "reviewed"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
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
