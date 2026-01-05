import { useState, useMemo, useEffect } from 'react';
import { KPICard } from '@/components/fleet/KPICard';
import { FilterPanel } from '@/components/fleet/FilterPanel';
import { VehicleUtilizationChart } from '@/components/fleet/VehicleUtilizationChart';
import { DailyUsageChart } from '@/components/fleet/DailyUsageChart';
import { TripsTable } from '@/components/fleet/TripsTable';
import { useDriversQuery } from '@/hooks/queries/useDriversQuery';
import { useVehiclesQuery } from '@/hooks/queries/useVehiclesQuery';
import { useSnowflakeTrips } from '@/hooks/useSnowflakeTrips';
import {
  filterTrips,
  calculateVehicleUsageMetrics,
  calculateDailyMetrics,
  calculateKPIs,
} from '@/utils/fleetCalculations';
import { FleetFilters } from '@/types/fleet';
import { Activity, Clock, TrendingUp, Car, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { useInitialDateRange, useUserInfo } from '@/hooks/useInitialData';
import { useAuth } from '@/hooks/useAuth';

const Trips = () => {
  const { data: driversData, isLoading: driversLoading, error: driversError } = useDriversQuery();
  const {
    data: vehiclesData,
    isLoading: vehiclesLoading,
    error: vehiclesError,
  } = useVehiclesQuery();
  const { dateFrom, dateTo } = useInitialDateRange();
  const { hasAdminAccess } = useAuth();
  const azureUser = useUserInfo();

  const norm = (s?: string | null) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

  const snowflakeDrivers = useMemo(() => {
    if (!driversData?.length) return driversData ?? [];

    // admins see all
    if (hasAdminAccess) return driversData;

    const azureName = norm(azureUser?.full_name);
    const azureEmail = norm(azureUser?.email);

    return driversData.filter((d) => {
      const driverName = norm(`${d?.first_name ?? ''} ${d?.last_name ?? ''}`);
      const driverEmail = norm(d?.email);

      return (
        (azureName && driverName === azureName) ||
        (azureEmail && driverEmail && driverEmail === azureEmail)
      );
    });
  }, [driversData, hasAdminAccess, azureUser?.full_name, azureUser?.email]);

  const snowflakeVehicles = useMemo(() => vehiclesData ?? [], [vehiclesData]);

  const allVehicles = useMemo(
    () => (snowflakeVehicles.length > 0 ? snowflakeVehicles : []),
    [snowflakeVehicles],
  );

  const driverOptions = useMemo(
    () => snowflakeDrivers.map((d) => `${d.first_name} ${d.last_name}`).sort(),
    [snowflakeDrivers],
  );

  const licensePlateOptions = useMemo(
    () =>
      snowflakeVehicles
        .map((v) => v.license_plate)
        .filter(Boolean)
        .sort(),
    [snowflakeVehicles],
  );

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

  const [filters, setFilters] = useState<FleetFilters>({
    dateFrom: dateFrom,
    dateTo: dateTo,
    drivers: [],
    vehicles: [],
    licensePlates: [],
    safetyGradeMin: 0,
    safetyGradeMax: 100,
    tripStatus: [],
    driverStatus: 'active',
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

  // Baseline trips: respects date range + implicit driver, but ignores license plate filter
  const tripsForPlateOptions = useMemo(() => {
    if (driverOptions.length === 0) return [];
    if (tripsLoading || allTrips.length === 0) return [];

    if (
      !loadedDateRange ||
      loadedDateRange.dateFrom !== filters.dateFrom ||
      loadedDateRange.dateTo !== filters.dateTo
    ) {
      return [];
    }

    const effectiveFilters = { ...filters };

    // keep implicit driver behavior
    if (!hasAdminAccess && driverOptions.length === 1 && filters.drivers.length === 0) {
      effectiveFilters.drivers = [driverOptions[0]];
    }

    // IMPORTANT: ignore the currently selected plate so options stay stable
    effectiveFilters.licensePlates = [];

    return filterTrips(allTrips, effectiveFilters, snowflakeDrivers);
  }, [allTrips, filters, tripsLoading, loadedDateRange, driverOptions, hasAdminAccess, snowflakeDrivers]);

  const userHistoryLicensePlates = useMemo(() => {
    return Array.from(
      new Set((tripsForPlateOptions ?? []).map((t) => t.license_plate).filter(Boolean)),
    ).sort();
  }, [tripsForPlateOptions]);

  // Only filter trips if they match the current filter date range
  const filteredTrips = useMemo(() => {
    // Don't show trips if user has no matching drivers (non-admin with no driver match)
    if (driverOptions.length === 0) return [];

    // Don't filter while loading
    if (tripsLoading || allTrips.length === 0) return [];

    // Ensure loaded trips match the current filter date range
    if (
      !loadedDateRange ||
      loadedDateRange.dateFrom !== filters.dateFrom ||
      loadedDateRange.dateTo !== filters.dateTo
    ) {
      return [];
    }

    // For non-admin users with a single driver match, auto-filter by that driver
    const effectiveFilters = { ...filters };
    if (!hasAdminAccess && driverOptions.length === 1 && filters.drivers.length === 0) {
      effectiveFilters.drivers = [driverOptions[0]];
    }

    return filterTrips(allTrips, effectiveFilters, snowflakeDrivers);
  }, [allTrips, filters, tripsLoading, loadedDateRange, driverOptions, hasAdminAccess, snowflakeDrivers]);

  const vehicleMetrics = useMemo(
    () => calculateVehicleUsageMetrics(filteredTrips, allVehicles),
    [filteredTrips, allVehicles],
  );
  const dailyMetrics = useMemo(() => calculateDailyMetrics(filteredTrips), [filteredTrips]);
  const kpis = useMemo(() => calculateKPIs(filteredTrips), [filteredTrips]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trips Overview</h1>
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
          driversData={snowflakeDrivers}
          licensePlates={licensePlateOptions}
          loading={tripsLoading}
          userHistoryLicensePlates={userHistoryLicensePlates}
        />

        <div className="text-xs text-muted-foreground flex justify-between items-center">
          {tripsLoading ? (
            <span>
              Loading trips from Snowflake... {loadedCount.toLocaleString()}/
              {totalCount.toLocaleString()}
            </span>
          ) : tripsError ? (
            <span className="text-destructive">
              Failed to load trips from Snowflake: {tripsError}
            </span>
          ) : (
            <span>Loaded {allTrips.length.toLocaleString()} trips from Snowflake.</span>
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

        {driverOptions.length > 0 ? (
          <TripsTable trips={filteredTrips} loading={tripsLoading} totalCount={totalCount} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No matching driver found for your account. Trip data is not available.
          </div>
        )}
      </div>
    </div>
  );
};

export default Trips;
