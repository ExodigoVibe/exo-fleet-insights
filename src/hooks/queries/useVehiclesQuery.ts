import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Vehicle } from "@/types/fleet";

interface SnowflakeResponse {
  columns: Array<{ name: string }>;
  rows: any[][];
}

async function fetchVehiclesFromSnowflake(): Promise<Vehicle[]> {
  const query = "SELECT * FROM BUSINESS_DB.ITURAN.VEHICLES";

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
    vehicle_id: Number(row[columnMap["VEHICLE_ID"]] ?? 0),
    vin: row[columnMap["VIN"]] ?? "",
    nickname: row[columnMap["NICKNAME"]] ?? "",
    model_name: row[columnMap["MODEL_NAME"]] ?? "",
    make_name: row[columnMap["MAKE_NAME"]] ?? "",
    model_year: String(row[columnMap["MODEL_YEAR"]] ?? ""),
    color: row[columnMap["COLOR"]] ?? "",
    motion_status: row[columnMap["MOTION_STATUS"]] ?? "",
    telematics_units: [],
  }));
}

export function useVehiclesQuery() {
  return useQuery({
    queryKey: ["snowflake-vehicles"],
    queryFn: fetchVehiclesFromSnowflake,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
}
