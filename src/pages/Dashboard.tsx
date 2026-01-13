import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDriversQuery } from '@/hooks/queries/useDriversQuery';
import { useVehiclesQuery } from '@/hooks/queries/useVehiclesQuery';
import { useVehicleRequestsQuery } from '@/hooks/queries/useVehicleRequestsQuery';
import { useEventReportsQuery } from '@/hooks/queries/useEventReportsQuery';
import { useAssignedVehiclesQuery } from '@/hooks/queries/useAssignedVehiclesQuery';
import { useVehicleAssignmentsQuery } from '@/hooks/queries/useVehicleAssignmentsQuery';
import {
  FileText,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Car,
  Calendar,
  User,
  ArrowRight,
  Users,
  Circle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ReportEventDialog } from '@/components/event-reports/ReportEventDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const { data: driversData, isLoading: driversLoading, error: driversError } = useDriversQuery();
  const {
    data: vehiclesData,
    isLoading: vehiclesLoading,
    error: vehiclesError,
  } = useVehiclesQuery();
  const { data: vehicleRequests } = useVehicleRequestsQuery();
  const { data: eventReports } = useEventReportsQuery();
  const { data: assignedVehiclesData } = useAssignedVehiclesQuery();
  const { data: vehicleAssignments } = useVehicleAssignmentsQuery();
  const { hasAdminAccess, user } = useAuth();
  const snowflakeDrivers = driversData ?? [];
  const snowflakeVehicles = vehiclesData ?? [];
  // Show error toasts
  useEffect(() => {
    if (driversError) {
      toast.error(
        `Failed to load drivers: ${driversError instanceof Error ? driversError.message : String(driversError)}`,
      );
    }
  }, [driversError]);

  useEffect(() => {
    if (vehiclesError) {
      toast.error(
        `Failed to load vehicles: ${vehiclesError instanceof Error ? vehiclesError.message : String(vehiclesError)}`,
      );
    }
  }, [vehiclesError]);

  // Calculate requests recap data - filter by user email for non-admin users
  const requestsRecap = useMemo(() => {
    let requests = vehicleRequests || [];
    if (!hasAdminAccess && user?.email) {
      requests = requests.filter((r) => r.email === user.email);
    }
    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'pending_manager').length;
    return { total, pending };
  }, [vehicleRequests, hasAdminAccess, user?.email]);

  // Build assignment maps (same logic as Vehicles page)
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

  const legacyAssignmentMap = useMemo(() => {
    const map = new Map<string, string>();
    assignedVehiclesData?.forEach((assignment) => {
      assignment.license_plates.forEach((plate) => {
        map.set(plate, assignment.employee_name);
      });
    });
    return map;
  }, [assignedVehiclesData]);

  // Calculate vehicle fleet recap data with priority: maintenance status > assigned/available
  const vehicleFleetRecap = useMemo(() => {
    const total = snowflakeVehicles.length;
    let available = 0;
    let assigned = 0;
    let maintenance = 0;

    snowflakeVehicles.forEach((vehicle) => {
      const assignment = vehicleAssignmentMap.get(vehicle.license_plate);

      // If there's an explicit status like "maintenance", it takes priority
      if (assignment?.status?.toLowerCase() === 'maintenance') {
        maintenance++;
      } else {
        // Check if driver is assigned (from new table or legacy table)
        const hasDriver = assignment?.driverName || legacyAssignmentMap.has(vehicle.license_plate);
        if (hasDriver) {
          assigned++;
        } else {
          available++;
        }
      }
    });

    return { total, available, assigned, maintenance };
  }, [snowflakeVehicles, vehicleAssignmentMap, legacyAssignmentMap]);

  // Get recent requests (last 3) - filter by user email for non-admin users
  const recentRequests = useMemo(() => {
    let requests = vehicleRequests || [];
    if (!hasAdminAccess && user?.email) {
      requests = requests.filter((r) => r.email === user.email);
    }
    return requests
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [vehicleRequests, hasAdminAccess, user?.email]);

  // Get recent event reports (last 5) - filter by user email for non-admin users
  const recentEventReports = useMemo(() => {
    let reports = eventReports || [];
    if (!hasAdminAccess && user?.email) {
      reports = reports.filter((r) => r.employee_name === user.email);
    }
    return reports
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [eventReports, hasAdminAccess, user?.email]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('dashboard.welcome')}
            </p>
          </div>
          <Button variant="destructive" className="gap-2" onClick={() => setReportDialogOpen(true)}>
            <AlertTriangle className="h-4 w-4" /> {t('dashboard.reportEvent')}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Requests Recap Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">{t('dashboard.requests')}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div onClick={() => navigate('/requests?filter=all')} className="cursor-pointer">
              <Card className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{t('dashboard.totalRequests')}</p>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-foreground">
                          {requestsRecap.total}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('dashboard.allRequestsSubmitted')}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div
              onClick={() => navigate('/requests?filter=pending_manager')}
              className="cursor-pointer"
            >
              <Card className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{t('dashboard.pendingRequests')}</p>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-foreground">
                          {requestsRecap.pending}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('dashboard.requestsAwaiting')}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Vehicle Fleet Recap Section */}
        {hasAdminAccess && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">{t('dashboard.vehicleFleet')}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div onClick={() => navigate('/vehicle-fleet?filter=all')} className="cursor-pointer">
                <Card className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{t('dashboard.totalVehicles')}</p>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-3xl font-bold text-foreground">
                            {vehicleFleetRecap.total}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.entireFleet')}</p>
                      </div>
                      <Car className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div
                onClick={() => navigate('/vehicle-fleet?filter=available')}
                className="cursor-pointer"
              >
                <Card className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{t('dashboard.available')}</p>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-3xl font-bold text-emerald-600">
                            {vehicleFleetRecap.available}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.readyForAssignment')}</p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Circle className="h-4 w-4 text-white fill-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div
                onClick={() => navigate('/vehicle-fleet?filter=assigned')}
                className="cursor-pointer"
              >
                <Card className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{t('dashboard.assigned')}</p>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-3xl font-bold text-blue-600">
                            {vehicleFleetRecap.assigned}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.currentlyInUse')}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div
                onClick={() => navigate('/vehicle-fleet?filter=maintenance')}
                className="cursor-pointer"
              >
                <Card className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{t('dashboard.maintenance')}</p>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-3xl font-bold text-amber-600">
                            {vehicleFleetRecap.maintenance}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.beingServiced')}</p>
                      </div>
                      <Wrench className="h-8 w-8 text-amber-600" />
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
                  <h2 className="text-lg font-semibold text-foreground">{t('dashboard.recentRequests')}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:bg-gray-100 hover:text-foreground"
                  onClick={() => navigate('/requests')}
                >
                  {t('common.viewAll')} <ArrowRight className="ms-2 h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4 pb-3 border-b text-sm font-medium text-muted-foreground">
                  <div>{t('dashboard.employeeName')}</div>
                  <div>{t('common.type')}</div>
                  <div>{t('common.date')}</div>
                  <div>{t('common.status')}</div>
                  <div>{t('common.actions')}</div>
                </div>

                {recentRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">{t('dashboard.noRequestsFound')}</div>
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
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900"
                        >
                          {request.usage_type === 'single_use' ? t('dashboard.singleUse') : t('dashboard.permanentDriver')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(request.start_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
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
                          {request.status === 'pending_manager'
                            ? t('dashboard.pendingHOD')
                            : request.status === 'approved'
                              ? t('dashboard.approved')
                              : t('dashboard.rejected')}
                        </Badge>
                      </div>
                      <div>{/* Empty column for Actions - click handled by row */}</div>
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
                  <h2 className="text-lg font-semibold text-foreground">{t('dashboard.recentEventReports')}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:bg-gray-100 hover:text-foreground"
                  onClick={() => navigate('/event-reports')}
                >
                  {t('common.viewAll')} <ArrowRight className="ms-2 h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4 pb-3 border-b text-sm font-medium text-muted-foreground">
                  <div>{t('dashboard.employeeName')}</div>
                  <div>{t('dashboard.vehicle')}</div>
                  <div>{t('common.date')}</div>
                  <div>{t('dashboard.severity')}</div>
                  <div>{t('common.status')}</div>
                </div>

                {recentEventReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">{t('dashboard.noEventReportsFound')}</div>
                ) : (
                  recentEventReports.map((report) => (
                    <div
                      key={report.id}
                      className="grid grid-cols-5 gap-4 py-3 items-center hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                      onClick={() => navigate('/event-reports')}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="font-medium text-foreground">{report.employee_name}</div>
                      </div>
                      <div className="text-foreground">{report.vehicle_license_plate}</div>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(report.event_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div>
                        <Badge
                          variant="secondary"
                          className={
                            report.severity === 'extensive'
                              ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900'
                          }
                        >
                          {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <Badge
                          variant="secondary"
                          className={
                            report.status === 'pending'
                              ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900'
                              : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-900'
                          }
                        >
                          {report.status === 'pending' ? t('dashboard.pending') : t('dashboard.closed')}
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

      <ReportEventDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} />
    </div>
  );
};

export default Dashboard;
