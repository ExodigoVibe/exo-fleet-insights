import { useState, useMemo, useEffect } from "react";
import { KPICard } from "@/components/fleet/KPICard";
import { FilterPanel } from "@/components/fleet/FilterPanel";
import { VehicleUtilizationChart } from "@/components/fleet/VehicleUtilizationChart";
import { DailyUsageChart } from "@/components/fleet/DailyUsageChart";
import { TripsTable } from "@/components/fleet/TripsTable";
import { useDriversQuery } from "@/hooks/queries/useDriversQuery";
import { useVehiclesQuery } from "@/hooks/queries/useVehiclesQuery";
import { useSnowflakeTrips } from "@/hooks/useSnowflakeTrips";
import {
  filterTrips,
  calculateVehicleUsageMetrics,
  calculateDailyMetrics,
  calculateKPIs,
} from "@/utils/fleetCalculations";
import { FleetFilters } from "@/types/fleet";
import { Activity, Clock, TrendingUp, Car, Timer } from "lucide-react";
import { toast } from "sonner";
import { useInitialDateRange } from "@/hooks/useInitialData";
import { useAuth } from "@/hooks/useAuth";

const Trips = () => {
  const { user, hasAdminAccess } = useAuth();
  const { data: driversData, isLoading: driversLoading, error: driversError } = useDriversQuery();
  const { data: vehiclesData, isLoading: vehiclesLoading, error: vehiclesError } = useVehiclesQuery();
  const { dateFrom, dateTo } = useInitialDateRange();
  const snowflakeDrivers = driversData ?? [];
  const snowflakeVehicles = vehiclesData ?? [];
  
  const allVehicles = useMemo(
    () => (snowflakeVehicles.length > 0 ? snowflakeVehicles : []),
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
    loadedDateRange,
  } = useSnowflakeTrips({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  // Filter trips based on user role - employees only see their own trips
  const userTrips = useMemo(() => {
    if (hasAdminAccess || !user?.full_name) return allTrips;
    return allTrips.filter(trip => trip.driver_name === user.full_name);
  }, [allTrips, hasAdminAccess, user?.full_name]);

  // For non-admin users, show only their own name in driver filter
  const driverOptions = useMemo(() => {
    if (hasAdminAccess) {
      return snowflakeDrivers.map((d) => `${d.first_name} ${d.last_name}`).sort();
    }
    // Non-admin users see only their name
    return user?.full_name ? [user.full_name] : [];
  }, [snowflakeDrivers, hasAdminAccess, user?.full_name]);

  // For non-admin users, show only license plates from their trips
  const licensePlateOptions = useMemo(() => {
    if (hasAdminAccess) {
      return snowflakeVehicles
        .map((v) => v.license_plate)
        .filter(Boolean)
        .sort();
    }
    // Non-admin users see only vehicles from their trips
    const userLicensePlates = new Set(
      userTrips.map(trip => trip.license_plate).filter(Boolean)
    );
    return Array.from(userLicensePlates).sort();
  }, [snowflakeVehicles, hasAdminAccess, userTrips]);

  // Only filter trips if they match the current filter date range
  const filteredTrips = useMemo(() => {
    // Don't filter while loading
    if (tripsLoading || userTrips.length === 0) return [];
    
    // Ensure loaded trips match the current filter date range
    if (!loadedDateRange || 
        loadedDateRange.dateFrom !== filters.dateFrom || 
        loadedDateRange.dateTo !== filters.dateTo) {
      return [];
    }
    
    return filterTrips(userTrips, filters);
  }, [userTrips, filters, tripsLoading, loadedDateRange]);
  
  const vehicleMetrics = useMemo(
    () => calculateVehicleUsageMetrics(filteredTrips, allVehicles),
    [filteredTrips, allVehicles]
  );
  const dailyMetrics = useMemo(() => calculateDailyMetrics(filteredTrips), [filteredTrips]);
  const kpis = useMemo(() => calculateKPIs(filteredTrips), [filteredTrips]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Fleet Usage Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Analyze vehicle utilization and driver performance
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          drivers={driverOptions}
          licensePlates={licensePlateOptions}
          loading={tripsLoading}
          disableDriverFilter={!hasAdminAccess}
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
    </div>
  );
};

export default Trips;
