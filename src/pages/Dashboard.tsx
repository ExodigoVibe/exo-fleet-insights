import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDriversQuery } from "@/hooks/queries/useDriversQuery";
import { useVehiclesQuery } from "@/hooks/queries/useVehiclesQuery";
import { useVehicleRequestsQuery } from "@/hooks/queries/useVehicleRequestsQuery";
import { FileText, Wrench, CheckCircle2, AlertTriangle, Clock, Car } from "lucide-react";
import { toast } from "sonner";
import { ReportEventDialog } from "@/components/event-reports/ReportEventDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Dashboard = () => {
  const navigate = useNavigate();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const { data: driversData, isLoading: driversLoading, error: driversError } = useDriversQuery();
  const { data: vehiclesData, isLoading: vehiclesLoading, error: vehiclesError } = useVehiclesQuery();
  const { data: vehicleRequests } = useVehicleRequestsQuery();
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

  // Calculate requests recap data
  const requestsRecap = useMemo(() => {
    const total = vehicleRequests?.length || 0;
    const pending = vehicleRequests?.filter(r => r.status === 'pending_manager').length || 0;
    return { total, pending };
  }, [vehicleRequests]);

  // Calculate vehicle fleet recap data
  const vehicleFleetRecap = useMemo(() => {
    const total = snowflakeVehicles.length;
    const available = snowflakeVehicles.filter(v => v.motion_status === 'parking').length;
    const maintenance = snowflakeVehicles.filter(v => 
      v.motion_status !== 'parking' && v.motion_status !== 'moving'
    ).length;
    return { total, available, maintenance };
  }, [snowflakeVehicles]);

  return (
    <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Fleet Usage Dashboard</h1>
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

        {/* Vehicle Fleet Recap Section */}
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

      </div>

      <ReportEventDialog 
        open={reportDialogOpen} 
        onOpenChange={setReportDialogOpen} 
      />
    </div>
  );
};

export default Dashboard;
