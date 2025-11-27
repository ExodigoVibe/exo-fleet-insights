import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VehicleLocation {
  license_plate: string;
  lat: number;
  lon: number;
  address?: string;
  timestamp?: string;
}

interface SnowflakeResponse {
  columns: Array<{ name: string }>;
  rows: any[][];
}

async function fetchVehicleLocationsFromSnowflake(): Promise<VehicleLocation[]> {
  const query = "SELECT * FROM BUSINESS_DB.ITURAN.VEHICLES_LOCATIONS";

  const { data, error } = await supabase.functions.invoke("snowflake-query", {
    body: { query },
  });

  if (error) throw error;
  if (!data) throw new Error("No data returned from Snowflake");

  const response = data as SnowflakeResponse;

  const columnMap: Record<string, number> = {};
  response.columns.forEach((col, idx) => {
    columnMap[col.name.toUpperCase()] = idx;
  });

  const rows = response.rows || [];

  return rows.map((row) => ({
    license_plate: row[columnMap["LICENSE_PLATE"]] ?? "",
    lat: Number(row[columnMap["LAT"]] ?? 0),
    lon: Number(row[columnMap["LON"]] ?? 0),
    address: row[columnMap["ADDRESS"]] ?? "",
    timestamp: row[columnMap["TIMESTAMP"]] ?? "",
  }));
}

export function useVehicleLocationsQuery() {
  return useQuery({
    queryKey: ["snowflake-vehicle-locations"],
    queryFn: fetchVehicleLocationsFromSnowflake,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
}
