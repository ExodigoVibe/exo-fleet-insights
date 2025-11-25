import { Trip, Vehicle, VehicleUsageMetrics, DailyUsageMetrics, FleetFilters } from "@/types/fleet";

export function filterTrips(trips: Trip[], filters: FleetFilters): Trip[] {
  return trips.filter((trip) => {
    const tripDate = new Date(trip.start_location.timestamp).toISOString().split("T")[0];
    
    if (tripDate < filters.dateFrom || tripDate > filters.dateTo) return false;
    
    if (filters.drivers.length > 0 && !filters.drivers.includes(trip.driver_name)) return false;
    
    if (filters.licensePlates.length > 0 && !filters.licensePlates.includes(trip.license_plate)) return false;
    
    if (trip.safety.safety_grade < filters.safetyGradeMin || trip.safety.safety_grade > filters.safetyGradeMax) return false;
    
    if (filters.tripStatus.length > 0 && !filters.tripStatus.includes(trip.trip_status)) return false;
    
    return true;
  });
}

export function calculateVehicleUsageMetrics(
  trips: Trip[],
  vehicles: Vehicle[]
): VehicleUsageMetrics[] {
  const vehicleMap = new Map(vehicles.map((v) => [v.license_plate, v]));
  const metricsMap = new Map<string, VehicleUsageMetrics>();

  trips.forEach((trip) => {
    const date = new Date(trip.start_location.timestamp).toISOString().split("T")[0];
    const key = `${trip.license_plate}-${date}`;
    const vehicle = vehicleMap.get(trip.license_plate);

    if (!vehicle) return;

    const activeDuration = trip.duration_in_seconds / 60 - trip.idle_duration_in_minutes;

    if (!metricsMap.has(key)) {
      metricsMap.set(key, {
        license_plate: trip.license_plate,
        nickname: vehicle.nickname,
        make_name: vehicle.make_name,
        model_name: vehicle.model_name,
        model_year: vehicle.model_year,
        date,
        active_time_minutes: 0,
        idle_time_minutes: 0,
        trips_count: 0,
        total_distance: 0,
        avg_safety_grade: 0,
        avg_fuel_grade: 0,
      });
    }

    const metrics = metricsMap.get(key)!;
    metrics.active_time_minutes += activeDuration;
    metrics.idle_time_minutes += trip.idle_duration_in_minutes;
    metrics.trips_count += 1;
    metrics.total_distance += trip.distance;
    metrics.avg_safety_grade =
      (metrics.avg_safety_grade * (metrics.trips_count - 1) + trip.safety.safety_grade) /
      metrics.trips_count;
    metrics.avg_fuel_grade =
      (metrics.avg_fuel_grade * (metrics.trips_count - 1) + trip.safety.fuel_grade) /
      metrics.trips_count;
  });

  return Array.from(metricsMap.values());
}

export function calculateDailyMetrics(trips: Trip[]): DailyUsageMetrics[] {
  const dailyMap = new Map<string, DailyUsageMetrics>();

  trips.forEach((trip) => {
    const date = new Date(trip.start_location.timestamp).toISOString().split("T")[0];
    const activeDuration = trip.duration_in_seconds / 60 - trip.idle_duration_in_minutes;

    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        active_time_minutes: 0,
        idle_time_minutes: 0,
        trips_count: 0,
        active_vehicles_count: 0,
      });
    }

    const metrics = dailyMap.get(date)!;
    metrics.active_time_minutes += activeDuration;
    metrics.idle_time_minutes += trip.idle_duration_in_minutes;
    metrics.trips_count += 1;
  });

  // Calculate active vehicles per day
  trips.forEach((trip) => {
    const date = new Date(trip.start_location.timestamp).toISOString().split("T")[0];
    const metrics = dailyMap.get(date);
    if (metrics) {
      const uniqueVehicles = new Set(
        trips
          .filter((t) => new Date(t.start_location.timestamp).toISOString().split("T")[0] === date)
          .map((t) => t.license_plate)
      );
      metrics.active_vehicles_count = uniqueVehicles.size;
    }
  });

  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateKPIs(trips: Trip[]) {
  const totalActiveTime = trips.reduce(
    (sum, trip) => sum + (trip.duration_in_seconds / 60 - trip.idle_duration_in_minutes),
    0
  );
  const totalIdleTime = trips.reduce((sum, trip) => sum + trip.idle_duration_in_minutes, 0);
  const totalTrips = trips.length;
  const activeVehicles = new Set(trips.map((t) => t.license_plate)).size;
  const avgTripDuration = trips.length > 0 ? trips.reduce((sum, t) => sum + t.duration_in_seconds, 0) / trips.length / 60 : 0;

  return {
    totalActiveTimeHours: totalActiveTime / 60,
    totalIdleTimeHours: totalIdleTime / 60,
    totalTrips,
    activeVehicles,
    avgTripDurationMinutes: avgTripDuration,
  };
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${hours}h ${mins}m`;
}

export function getUniqueDrivers(trips: Trip[]): string[] {
  return Array.from(new Set(trips.map((t) => t.driver_name))).sort();
}

export function getUniqueLicensePlates(trips: Trip[]): string[] {
  return Array.from(new Set(trips.map((t) => t.license_plate))).sort();
}
