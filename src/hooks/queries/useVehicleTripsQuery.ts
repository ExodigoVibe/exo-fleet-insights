import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trip } from "@/types/fleet";

interface SnowflakeResponse {
  columns: Array<{ name: string }>;
  rows: any[][];
  rowCount?: number;
}

async function fetchVehicleTrips(licensePlate: string): Promise<Trip[]> {
  if (!licensePlate) return [];

  const query = `
    SELECT * 
    FROM BUSINESS_DB.ITURAN.TRIPS 
    WHERE LICENSE_PLATE = '${licensePlate}'
    ORDER BY START_TIMESTAMP DESC
    LIMIT 50
  `;

  const { data, error } = await supabase.functions.invoke("snowflake-query", {
    body: { query },
  });

  if (error) throw error;
  if (!data) return [];

  const response = data as SnowflakeResponse;

  const columnMap: Record<string, number> = {};
  response.columns.forEach((col, idx) => {
    columnMap[col.name.toUpperCase()] = idx;
  });

  const rows = response.rows || [];

  const mapRowToTrip = (row: any[]): Trip => {
    const startTimestamp =
      row[columnMap["START_TIMESTAMP"]] ||
      row[columnMap["START_TIME"]] ||
      new Date().toISOString();

    const endTimestamp =
      row[columnMap["END_TIMESTAMP"]] ||
      row[columnMap["END_TIME"]] ||
      startTimestamp;

    const distance = Number(
      row[columnMap["DISTANCE"]] ?? row[columnMap["DISTANCE_KM"]] ?? 0
    );

    let durationSeconds = Number(
      row[columnMap["DURATION_IN_SECONDS"]] ??
        row[columnMap["DURATION"]] ??
        0
    );

    if (!durationSeconds && startTimestamp && endTimestamp) {
      const startMs = new Date(startTimestamp).getTime();
      const endMs = new Date(endTimestamp).getTime();
      if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs >= startMs) {
        durationSeconds = Math.round((endMs - startMs) / 1000);
      }
    }

    return {
      trip_id: Number(row[columnMap["TRIP_ID"]] ?? 0),
      license_plate: row[columnMap["LICENSE_PLATE"]] ?? "",
      driver_code: Number(row[columnMap["DRIVER_CODE"]] ?? 0),
      driver_name: row[columnMap["DRIVER_NAME"]] ?? "Unknown Driver",
      driver_source: Number(row[columnMap["DRIVER_SOURCE"]] ?? 0),
      start_location: {
        location: {
          point: {
            lat: Number(row[columnMap["START_LAT"]] ?? 0),
            lon: Number(row[columnMap["START_LON"]] ?? 0),
          },
          address: {
            location: row[columnMap["START_ADDRESS"]] ?? "",
            speedlimit: 50,
          },
        },
        odometer: Number(row[columnMap["START_ODOMETER"]] ?? 0),
        timestamp: new Date(startTimestamp).toISOString(),
      },
      end_location: {
        location: {
          point: {
            lat: Number(row[columnMap["END_LAT"]] ?? 0),
            lon: Number(row[columnMap["END_LON"]] ?? 0),
          },
          address: {
            location: row[columnMap["END_ADDRESS"]] ?? "",
          },
        },
        odometer: Number(row[columnMap["END_ODOMETER"]] ?? 0),
        timestamp: new Date(endTimestamp).toISOString(),
      },
      duration_in_seconds: durationSeconds,
      distance,
      max_speed: Number(row[columnMap["MAX_SPEED"]] ?? 0),
      idle_duration_in_minutes: Number(row[columnMap["IDLE_DURATION_IN_MINUTES"]] ?? 0),
      safety: {
        safety_grade: Number(row[columnMap["SAFETY_GRADE"]] ?? 80),
        fuel_grade: Number(row[columnMap["FUEL_GRADE"]] ?? 80),
        safety_events_count: Number(row[columnMap["SAFETY_EVENTS_COUNT"]] ?? 0),
      },
      trip_status: row[columnMap["TRIP_STATUS"]] ?? "trip_end",
    };
  };

  return rows.map(mapRowToTrip);
}

export function useVehicleTripsQuery(licensePlate: string) {
  return useQuery({
    queryKey: ["vehicle-trips", licensePlate],
    queryFn: () => fetchVehicleTrips(licensePlate),
    enabled: !!licensePlate,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
