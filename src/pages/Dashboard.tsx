import { useState, useMemo, useEffect } from "react";
import { KPICard } from "@/components/fleet/KPICard";
import { FilterPanel } from "@/components/fleet/FilterPanel";
import { VehicleUtilizationChart } from "@/components/fleet/VehicleUtilizationChart";
import { DailyUsageChart } from "@/components/fleet/DailyUsageChart";
import { VehicleDetailTable } from "@/components/fleet/VehicleDetailTable";
import { SnowflakeTest } from "@/components/SnowflakeTest";
import { useSnowflakeDrivers } from "@/hooks/useSnowflakeDrivers";
import { useSnowflakeVehicles } from "@/hooks/useSnowflakeVehicles";
import { useSnowflakeTrips } from "@/hooks/useSnowflakeTrips";
import {
  filterTrips,
  calculateVehicleUsageMetrics,
  calculateDailyMetrics,
  calculateKPIs,
  getUniqueDrivers,
  getUniqueLicensePlates,
} from "@/utils/fleetCalculations";
import { FleetFilters } from "@/types/fleet";
import { Activity, Clock, TrendingUp, Car, Timer, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { drivers: snowflakeDrivers = [], loading: driversLoading, error: driversError } = useSnowflakeDrivers();
  const { vehicles: snowflakeVehicles = [], loading: vehiclesLoading, error: vehiclesError } = useSnowflakeVehicles();
  const { trips: snowflakeTrips = [], loading: tripsLoading, error: tripsError } = useSnowflakeTrips();
  
  const allTrips = snowflakeTrips;
  const allVehicles = snowflakeVehicles;
  const drivers = useMemo(() => getUniqueDrivers(allTrips), [allTrips]);
  const licensePlates = useMemo(() => getUniqueLicensePlates(allTrips), [allTrips]);

  const isLoading = driversLoading || vehiclesLoading || tripsLoading;

  // Show success message when all data is loaded
  useEffect(() => {
    if (!isLoading) {
      const hasData = snowflakeDrivers.length > 0 || snowflakeVehicles.length > 0 || snowflakeTrips.length > 0;
      if (hasData) {
        toast.success(
          `Loaded ${snowflakeTrips.length} trips, ${snowflakeDrivers.length} drivers, and ${snowflakeVehicles.length} vehicles from Snowflake`
        );
      } else if (!driversError && !vehiclesError && !tripsError) {
        toast.info("No data found in Snowflake tables");
      }
    }
  }, [isLoading, snowflakeDrivers.length, snowflakeVehicles.length, snowflakeTrips.length, driversError, vehiclesError, tripsError]);

  // Show error toasts
  useEffect(() => {
    if (driversError) toast.error(`Failed to load drivers: ${driversError}`);
  }, [driversError]);

  useEffect(() => {
    if (vehiclesError) toast.error(`Failed to load vehicles: ${vehiclesError}`);
  }, [vehiclesError]);

  useEffect(() => {
    if (tripsError) toast.error(`Failed to load trips: ${tripsError}`);
  }, [tripsError]);

  const [filters, setFilters] = useState<FleetFilters>({
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    dateTo: new Date().toISOString().split("T")[0],
    drivers: [],
    vehicles: [],
    licensePlates: [],
    safetyGradeMin: 0,
    safetyGradeMax: 100,
    tripStatus: [],
  });

  const filteredTrips = useMemo(() => filterTrips(allTrips, filters), [allTrips, filters]);
  const vehicleMetrics = useMemo(
    () => calculateVehicleUsageMetrics(filteredTrips, allVehicles),
    [filteredTrips, allVehicles]
  );
  const dailyMetrics = useMemo(() => calculateDailyMetrics(filteredTrips), [filteredTrips]);
  const kpis = useMemo(() => calculateKPIs(filteredTrips), [filteredTrips]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">Fleet Usage Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Analyze vehicle utilization and driver performance
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <SnowflakeTest />

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading data from Snowflake...</span>
          </div>
        )}

        {!isLoading && (
          <>
            {allTrips.length === 0 && !tripsError && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No trip data available. The TRIPS table may be empty or the query may have failed.
                </p>
              </div>
            )}
            
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              drivers={drivers}
              licensePlates={licensePlates}
            />

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

            <VehicleDetailTable metrics={vehicleMetrics} />
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
