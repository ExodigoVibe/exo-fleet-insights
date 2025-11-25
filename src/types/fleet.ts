export interface Trip {
  trip_id: number;
  license_plate: string;
  driver_code: number;
  driver_name: string;
  driver_source: number;
  start_location: {
    location: {
      point: { lat: number; lon: number };
      address: { location: string; speedlimit?: number };
    };
    odometer: number;
    timestamp: string;
  };
  end_location: {
    location: {
      point: { lat: number; lon: number };
      address: { location: string };
    };
    odometer: number;
    timestamp: string;
  };
  duration_in_seconds: number;
  distance: number;
  max_speed: number;
  idle_duration_in_minutes: number;
  safety: {
    safety_grade: number;
    fuel_grade: number;
    safety_events_count: number;
  };
  trip_status: string;
}

export interface Vehicle {
  license_plate: string;
  vehicle_id: number;
  vin: string;
  nickname: string;
  model_name: string;
  make_name: string;
  model_year: string;
  color: string;
  motion_status: string;
  telematics_units: Array<{ ip_address: string }>;
}

export interface VehicleUsageMetrics {
  license_plate: string;
  nickname: string;
  make_name: string;
  model_name: string;
  model_year: string;
  date: string;
  active_time_minutes: number;
  idle_time_minutes: number;
  trips_count: number;
  total_distance: number;
  avg_safety_grade: number;
  avg_fuel_grade: number;
}

export interface DailyUsageMetrics {
  date: string;
  active_time_minutes: number;
  idle_time_minutes: number;
  trips_count: number;
  active_vehicles_count: number;
}

export interface FleetFilters {
  dateFrom: string;
  dateTo: string;
  drivers: string[];
  vehicles: string[];
  licensePlates: string[];
  safetyGradeMin: number;
  safetyGradeMax: number;
  tripStatus: string[];
}
