import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KPICard } from "@/components/fleet/KPICard";
import { FilterPanel } from "@/components/fleet/FilterPanel";
import { VehicleUtilizationChart } from "@/components/fleet/VehicleUtilizationChart";
import { DailyUsageChart } from "@/components/fleet/DailyUsageChart";
import { TripsTable } from "@/components/fleet/TripsTable";
import { SnowflakeTest } from "@/components/SnowflakeTest";
import { useDriversQuery } from "@/hooks/queries/useDriversQuery";
import { useVehiclesQuery } from "@/hooks/queries/useVehiclesQuery";
import { useSnowflakeTrips } from "@/hooks/useSnowflakeTrips";
import { useVehicleRequestsQuery } from "@/hooks/queries/useVehicleRequestsQuery";
import {
  filterTrips,
  calculateVehicleUsageMetrics,
  calculateDailyMetrics,
  calculateKPIs,
  getUniqueDrivers,
  getUniqueLicensePlates,
} from "@/utils/fleetCalculations";
import { FleetFilters, Trip } from "@/types/fleet";
import { Activity, Clock, TrendingUp, Car, Timer, AlertTriangle, FileText, Wrench, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useInitialDateRange } from "@/hooks/useInitialData";
import { ReportEventDialog } from "@/components/event-reports/ReportEventDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Dashboard = () => {
  const navigate = useNavigate();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const { data: driversData, isLoading: driversLoading, error: driversError } = useDriversQuery();
  const { data: vehiclesData, isLoading: vehiclesLoading, error: vehiclesError } = useVehiclesQuery();
  const { data: vehicleRequests } = useVehicleRequestsQuery();
  const { dateFrom, dateTo } = useInitialDateRange();
  const snowflakeDrivers = driversData ?? [];
  const snowflakeVehicles = vehiclesData ?? [];
  
  const allVehicles = useMemo(
    () => (snowflakeVehicles.length > 0 ? snowflakeVehicles : []),
    [snowflakeVehicles]
  );

  // For filters, use the full master data from Snowflake drivers/vehicles
  // so you always see all drivers and license plates immediately,
  // independent of how many trips have been chunk-processed so far.
  const driverOptions = useMemo(
    () =>
      snowflakeDrivers.map((d) => `${d.first_name} ${d.last_name}`).sort(),
    [snowflakeDrivers]
  );

  const licensePlateOptions = useMemo(
    () =>
      snowflakeVehicles
        .map((v) => v.license_plate)
        .filter(Boolean)
        .sort(),
    [snowflakeVehicles]
  );

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

  const [filters, setFilters] = useState<FleetFilters>({
    dateFrom: dateFrom,
    dateTo: dateTo,
    drivers: [],
    vehicles: [],
    licensePlates: [],
    safetyGradeMin: 0,
    safetyGradeMax: 100,
    tripStatus: [],
  });

  // Fetch trips from Snowflake
  const {
    trips: allTrips,
    loading: tripsLoading,
    error: tripsError,
    loadedCount,
    totalCount,
  } = useSnowflakeTrips({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  // Don't filter trips while loading or if trips data doesn't match filter date range
  const filteredTrips = useMemo(() => {
    if (tripsLoading || allTrips.length === 0) return [];
    
    // Verify loaded trips match the current filter date range
    const hasTripsInDateRange = allTrips.some(trip => {
      const tripDate = new Date(trip.start_location.timestamp).toISOString().split("T")[0];
      return tripDate >= filters.dateFrom && tripDate <= filters.dateTo;
    });
    
    // Only filter if we have trips in the correct date range
    if (!hasTripsInDateRange && allTrips.length > 0) {
      return [];
    }
    
    return filterTrips(allTrips, filters);
  }, [allTrips, filters, tripsLoading]);
  
  const vehicleMetrics = useMemo(
    () => calculateVehicleUsageMetrics(filteredTrips, allVehicles),
    [filteredTrips, allVehicles]
  );
  const dailyMetrics = useMemo(() => calculateDailyMetrics(filteredTrips), [filteredTrips]);
  const kpis = useMemo(() => calculateKPIs(filteredTrips), [filteredTrips]);

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

        {/* Fleet Usage Analytics Section */}
        <div className="pt-4">
          <h2 className="text-xl font-semibold text-foreground mb-4">Fleet Usage Analytics</h2>
        </div>
        
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          drivers={driverOptions}
          licensePlates={licensePlateOptions}
          loading={tripsLoading}
        />

        <div className="text-xs text-muted-foreground flex justify-between items-center">
          {tripsLoading ? (
            <span>
              Loading trips from Snowflake... {loadedCount.toLocaleString()}/{totalCount.toLocaleString()}
            </span>
          ) : tripsError ? (
            <span className="text-destructive">
              Failed to load trips from Snowflake: {tripsError}
            </span>
          ) : (
            <span>
              Loaded
              {" "}
              {allTrips.length.toLocaleString()}
              {" "}
              trips from Snowflake.
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <KPICard
            title="Active Driving Time"
            value={`${kpis.totalActiveTimeHours.toFixed(1)}h`}
            icon={Activity}
            subtitle="Total time vehicles were actively driving"
          />
          <KPICard
            title="Idle Time"
            value={`${kpis.totalIdleTimeHours.toFixed(1)}h`}
            icon={Clock}
            subtitle="Total time engines were on but not moving"
          />
          <KPICard
            title="Total Trips"
            value={kpis.totalTrips.toLocaleString()}
            icon={TrendingUp}
            subtitle="Number of completed trips"
          />
          <KPICard
            title="Active Vehicles"
            value={kpis.activeVehicles}
            icon={Car}
            subtitle="Vehicles with at least one trip"
          />
          <KPICard
            title="Avg Trip Duration"
            value={`${kpis.avgTripDurationMinutes.toFixed(0)}m`}
            icon={Timer}
            subtitle="Average duration per trip"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <VehicleUtilizationChart metrics={vehicleMetrics} />
          <DailyUsageChart metrics={dailyMetrics} />
        </div>

        <TripsTable trips={filteredTrips} loading={tripsLoading} totalCount={totalCount}/>
      </div>

      <ReportEventDialog 
        open={reportDialogOpen} 
        onOpenChange={setReportDialogOpen} 
      />
    </div>
  );
};

export default Dashboard;
