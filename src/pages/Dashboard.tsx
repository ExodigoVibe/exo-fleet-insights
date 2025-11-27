import { useState, useMemo, useEffect } from "react";
import { KPICard } from "@/components/fleet/KPICard";
import { FilterPanel } from "@/components/fleet/FilterPanel";
import { VehicleUtilizationChart } from "@/components/fleet/VehicleUtilizationChart";
import { DailyUsageChart } from "@/components/fleet/DailyUsageChart";
import { TripsTable } from "@/components/fleet/TripsTable";
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
import { FleetFilters, Trip } from "@/types/fleet";
import { Activity, Clock, TrendingUp, Car, Timer } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { drivers: snowflakeDrivers, loading: driversLoading, error: driversError } = useSnowflakeDrivers();
  const { vehicles: snowflakeVehicles, loading: vehiclesLoading, error: vehiclesError } = useSnowflakeVehicles();
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
      toast.error(`Failed to load drivers: ${driversError}`);
    }
  }, [driversError]);

  useEffect(() => {
    if (vehiclesError) {
      toast.error(`Failed to load vehicles: ${vehiclesError}`);
    }
  }, [vehiclesError]);

  const [filters, setFilters] = useState<FleetFilters>({
    dateFrom: new Date("2025-11-24").toISOString().split("T")[0],
    dateTo: new Date().toISOString().split("T")[0],
    drivers: [],
    vehicles: [],
    licensePlates: [],
    safetyGradeMin: 0,
    safetyGradeMax: 100,
    tripStatus: [],
  });

  // Pass date filters to useSnowflakeTrips to filter at database level
  const {
    trips: snowflakeTrips,
    loading: tripsLoading,
    error: tripsError,
    loadedCount,
    totalCount,
  } = useSnowflakeTrips({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
  
  // Use real Snowflake trips only
  const allTrips: Trip[] = snowflakeTrips;

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
              Loading trips from Snowflake (
              {loadedCount.toLocaleString()}
              /
              {(totalCount || loadedCount).toLocaleString()}
              {" "}
              rows processed)...
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

        <TripsTable trips={filteredTrips} />
      </main>
    </div>
  );
};

export default Dashboard;
