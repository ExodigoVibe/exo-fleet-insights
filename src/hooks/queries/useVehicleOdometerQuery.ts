import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SnowflakeResponse {
  columns: Array<{ name: string }>;
  rows: any[][];
}

async function fetchLatestOdometer(licensePlate: string): Promise<number | null> {
  if (!licensePlate) return null;

  // Query for the most recent trip for this license plate to get the latest odometer
  const query = `
    SELECT END_ODOMETER, END_TIMESTAMP
    FROM BUSINESS_DB.ITURAN.TRIPS 
    WHERE LICENSE_PLATE = '${licensePlate}'
    ORDER BY END_TIMESTAMP DESC
    LIMIT 1
  `;

  const { data, error } = await supabase.functions.invoke("snowflake-query", {
    body: { query },
  });

  if (error) {
    console.error("Error fetching odometer:", error);
    return null;
  }

  if (!data) return null;

  const response = data as SnowflakeResponse;
  
  if (!response.rows || response.rows.length === 0) {
    return null;
  }

  const columnMap: Record<string, number> = {};
  response.columns.forEach((col, idx) => {
    columnMap[col.name.toUpperCase()] = idx;
  });

  const row = response.rows[0];
  const odometer = Number(
    row[columnMap["END_ODOMETER"]] ?? row[columnMap["ODOMETER"]] ?? 0
  );

  return odometer > 0 ? odometer : null;
}

export function useVehicleOdometerQuery(licensePlate: string) {
  return useQuery({
    queryKey: ["vehicle-odometer", licensePlate],
    queryFn: () => fetchLatestOdometer(licensePlate),
    enabled: !!licensePlate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
