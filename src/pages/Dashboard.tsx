import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDriversQuery } from "@/hooks/queries/useDriversQuery";
import { useVehiclesQuery } from "@/hooks/queries/useVehiclesQuery";
import { useVehicleRequestsQuery } from "@/hooks/queries/useVehicleRequestsQuery";
import { useEventReportsQuery } from "@/hooks/queries/useEventReportsQuery";
import { FileText, Wrench, CheckCircle2, AlertTriangle, Clock, Car, Calendar, User, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ReportEventDialog } from "@/components/event-reports/ReportEventDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const navigate = useNavigate();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const { user, isEmployee } = useAuth();
  const { data: driversData, isLoading: driversLoading, error: driversError } = useDriversQuery();
  const { data: vehiclesData, isLoading: vehiclesLoading, error: vehiclesError } = useVehiclesQuery();
  const { data: vehicleRequests } = useVehicleRequestsQuery();
  const { data: eventReports } = useEventReportsQuery();
  const snowflakeDrivers = driversData ?? [];
  const snowflakeVehicles = vehiclesData ?? [];

  // Show error toasts
  useEffect(() => {
    if (driversError) {
      toast.error(`Failed to load drivers: ${driversError instanceof Error ? driversError.message : String(driversError)}`);
    }
  }, [driversError]);

  useEffect(() => {
    if (vehiclesError) {
      toast.error(`Failed to load vehicles: ${vehiclesError instanceof Error ? vehiclesError.message : String(vehiclesError)}`);
    }
  }, [vehiclesError]);

  // Calculate requests recap data (filtered by user email and full_name for employees)
  const requestsRecap = useMemo(() => {
    console.log("Dashboard - isEmployee:", isEmployee);
    console.log("Dashboard - user:", user);
    console.log("Dashboard - all requests:", vehicleRequests);
    
    const filteredRequests = isEmployee && user
      ? (vehicleRequests || []).filter(r => {
          // Match by email (case-insensitive) OR full_name (case-insensitive)
          const emailMatch = r.email?.toLowerCase() === user.email?.toLowerCase();
          const nameMatch = r.full_name?.toLowerCase() === user.full_name?.toLowerCase();
          console.log("Request:", r.full_name, "Email match:", emailMatch, "Name match:", nameMatch);
          return emailMatch || nameMatch;
        })
      : (vehicleRequests || []);
    
    console.log("Dashboard - filtered requests:", filteredRequests);
    const total = filteredRequests.length;
    const pending = filteredRequests.filter(r => r.status === 'pending_manager').length;
    return { total, pending };
  }, [vehicleRequests, isEmployee, user]);

  // Calculate vehicle fleet recap data
  const vehicleFleetRecap = useMemo(() => {
    const total = snowflakeVehicles.length;
    const available = snowflakeVehicles.filter(v => v.motion_status === 'parking').length;
    const maintenance = snowflakeVehicles.filter(v => 
      v.motion_status !== 'parking' && v.motion_status !== 'moving'
    ).length;
    return { total, available, maintenance };
  }, [snowflakeVehicles]);

  // Get recent requests (last 3, filtered by user email and full_name for employees)
  const recentRequests = useMemo(() => {
    const filteredRequests = isEmployee && user
      ? (vehicleRequests || []).filter(r => {
          const emailMatch = r.email?.toLowerCase() === user.email?.toLowerCase();
          const nameMatch = r.full_name?.toLowerCase() === user.full_name?.toLowerCase();
          return emailMatch || nameMatch;
        })
      : (vehicleRequests || []);
    return filteredRequests
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [vehicleRequests, isEmployee, user]);

  // Get recent event reports (last 5, filtered by user full_name for employees)
  const recentEventReports = useMemo(() => {
    console.log("Dashboard - all event reports:", eventReports);
    const filteredReports = isEmployee && user?.full_name
      ? (eventReports || []).filter(r => {
          const nameMatch = r.employee_name?.toLowerCase() === user.full_name?.toLowerCase();
          console.log("Event report:", r.employee_name, "Match:", nameMatch);
          return nameMatch;
        })
      : (eventReports || []);
    console.log("Dashboard - filtered event reports:", filteredReports);
    return filteredReports
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [eventReports, isEmployee, user?.full_name]);

  return (
    <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Fleet Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Analyze vehicle utilization and driver performance
              </p>
            </div>
            <Button 
              variant="destructive" 
              className="gap-2"
              onClick={() => setReportDialogOpen(true)}
            >
              <AlertTriangle className="h-4 w-4" /> Report Event
            </Button>
          </div>
        </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Requests Recap Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Requests</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div onClick={() => navigate("/requests?filter=all")} className="cursor-pointer">
              <Card className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-foreground">{requestsRecap.total}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">All vehicle requests submitted</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div onClick={() => navigate("/requests?filter=pending_manager")} className="cursor-pointer">
              <Card className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-foreground">{requestsRecap.pending}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">Requests & reports awaiting action</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Vehicle Fleet Recap Section - Hidden for employees */}
        {!isEmployee && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Vehicle Fleet</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div onClick={() => navigate("/vehicle-fleet?filter=all")} className="cursor-pointer">
                <Card className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Total Vehicles</p>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-3xl font-bold text-foreground">{vehicleFleetRecap.total}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">Entire fleet overview</p>
                      </div>
                      <Car className="h-8 w-8 text-gray-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div onClick={() => navigate("/vehicle-fleet?filter=parking")} className="cursor-pointer">
                <Card className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Available Vehicles</p>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-3xl font-bold text-foreground">{vehicleFleetRecap.available}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">Ready for assignment</p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div onClick={() => navigate("/vehicle-fleet?filter=other")} className="cursor-pointer">
                <Card className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">In Maintenance</p>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-3xl font-bold text-foreground">{vehicleFleetRecap.maintenance}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">Currently being serviced</p>
                      </div>
                      <Wrench className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Recent Requests Section */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-foreground">Recent Requests</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-primary hover:bg-gray-100 hover:text-foreground"
                  onClick={() => navigate("/requests")}
                >
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4 pb-3 border-b text-sm font-medium text-muted-foreground">
                  <div>Employee</div>
                  <div>Type</div>
                  <div>Date</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                
                {recentRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No requests found
                  </div>
                ) : (
                  recentRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="grid grid-cols-5 gap-4 py-3 items-center hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                      onClick={() => navigate(`/requests/${request.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-foreground">{request.full_name}</div>
                          <div className="text-xs text-muted-foreground">{request.department}</div>
                        </div>
                      </div>
                      <div>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900">
                          {request.usage_type === 'single_use' ? 'Single Use' : 'Permanent Driver'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(request.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div>
                        <Badge 
                          variant="secondary"
                          className={
                            request.status === 'pending_manager' 
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900'
                              : request.status === 'approved'
                              ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900'
                              : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900'
                          }
                        >
                          {request.status === 'pending_manager' ? 'Pending HOD' : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        {/* Empty column for Actions - click handled by row */}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Event Reports Section */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h2 className="text-lg font-semibold text-foreground">Recent Event Reports</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-primary hover:bg-gray-100 hover:text-foreground"
                  onClick={() => navigate("/event-reports")}
                >
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4 pb-3 border-b text-sm font-medium text-muted-foreground">
                  <div>Vehicle</div>
                  <div>Employee</div>
                  <div>Date</div>
                  <div>Severity</div>
                  <div>Status</div>
                </div>
                
                {recentEventReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No event reports found
                  </div>
                ) : (
                  recentEventReports.map((report) => (
                    <div 
                      key={report.id} 
                      className="grid grid-cols-5 gap-4 py-3 items-center hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                      onClick={() => navigate(`/event-reports?reportId=${report.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <div className="font-medium text-foreground">{report.vehicle_license_plate}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm text-foreground">{report.employee_name}</div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(report.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div>
                        <Badge 
                          variant="secondary"
                          className={
                            report.severity === 'slight'
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900'
                              : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900'
                          }
                        >
                          {report.severity === 'slight' ? 'Slight Damage' : 'Extensive Damage'}
                        </Badge>
                      </div>
                      <div>
                        <Badge 
                          variant="secondary"
                          className={
                            report.status === 'pending'
                              ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900'
                              : report.status === 'reviewed'
                              ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900'
                              : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-900'
                          }
                        >
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      <ReportEventDialog 
        open={reportDialogOpen} 
        onOpenChange={setReportDialogOpen} 
      />
    </div>
  );
};

export default Dashboard;
