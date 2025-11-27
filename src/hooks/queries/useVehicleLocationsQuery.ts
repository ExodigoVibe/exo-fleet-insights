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

  console.log("[Vehicle Locations] Fetching from Snowflake...");

  const { data, error } = await supabase.functions.invoke("snowflake-query", {
    body: { query },
  });

  if (error) {
    console.error("[Vehicle Locations] Error:", error);
    throw error;
  }
  if (!data) {
    console.error("[Vehicle Locations] No data returned");
    throw new Error("No data returned from Snowflake");
  }

  const response = data as SnowflakeResponse;

  console.log("[Vehicle Locations] Available columns:", response.columns.map(c => c.name));
  console.log("[Vehicle Locations] Total rows:", response.rows?.length || 0);
  console.log("[Vehicle Locations] First row sample:", response.rows?.[0]);

  const columnMap: Record<string, number> = {};
  response.columns.forEach((col, idx) => {
    columnMap[col.name.toUpperCase()] = idx;
  });

  console.log("[Vehicle Locations] Column map:", columnMap);

  const rows = response.rows || [];

  const locations = rows.map((row) => ({
    license_plate: row[columnMap["LICENSE_PLATE"]] ?? "",
    lat: Number(row[columnMap["LAT"]] ?? 0),
    lon: Number(row[columnMap["LON"]] ?? 0),
    address: row[columnMap["ADDRESS"]] ?? "",
    timestamp: row[columnMap["TIMESTAMP"]] ?? "",
  }));

  console.log("[Vehicle Locations] First 3 processed locations:", locations.slice(0, 3));

  return locations;
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
