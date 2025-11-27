import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Driver } from "@/types/fleet";

interface SnowflakeResponse {
  columns: Array<{ name: string }>;
  rows: any[][];
}

async function fetchDriversFromSnowflake(): Promise<Driver[]> {
  const query = "SELECT * FROM BUSINESS_DB.ITURAN.DRIVERS";

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
    driver_id: Number(row[columnMap["DRIVER_ID"]] ?? 0),
    first_name: row[columnMap["FIRST_NAME"]] ?? "",
    last_name: row[columnMap["LAST_NAME"]] ?? "",
    identification_number: row[columnMap["IDENTIFICATION_NUMBER"]] ?? "",
    driver_code: Number(row[columnMap["DRIVER_CODE"]] ?? 0),
    managed_code: Number(row[columnMap["MANAGED_CODE"]] ?? 0),
    phone: row[columnMap["PHONE"]] ?? "",
    cellular: row[columnMap["CELLULAR"]] ?? "",
    email: row[columnMap["EMAIL"]] ?? "",
    is_blocked: Boolean(row[columnMap["IS_BLOCKED"]]),
    drive_permission_groups: [],
  }));
}

export function useDriversQuery() {
  return useQuery({
    queryKey: ["snowflake-drivers"],
    queryFn: fetchDriversFromSnowflake,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
}
