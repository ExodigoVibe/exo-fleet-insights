import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Driver } from "@/types/fleet";

interface SnowflakeResponse {
  columns: Array<{ name: string }>;
  rows: any[][];
}

export function useSnowflakeDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDrivers() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: functionError } = await supabase.functions.invoke(
          "snowflake-query",
          {
            body: {
              query: "SELECT * FROM BUSINESS_DB.ITURAN.DRIVERS",
            },
          }
        );

        if (functionError) throw functionError;
        if (!data) throw new Error("No data returned from Snowflake");

        const response = data as SnowflakeResponse;
        
        // Transform Snowflake rows to Driver objects
        const transformedDrivers: Driver[] = response.rows.map((row) => ({
          driver_id: parseInt(row[0] || "0"),
          first_name: row[1] || "",
          last_name: row[2] || "",
          identification_number: row[3] || "",
          driver_code: parseInt(row[4] || "0"),
          managed_code: parseInt(row[5] || "0"),
          phone: row[6] || "",
          cellular: row[7] || "",
          email: row[8] || "",
          is_blocked: row[9] === "true",
        }));

        setDrivers(transformedDrivers);
      } catch (err) {
        console.error("Error fetching drivers from Snowflake:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch drivers");
      } finally {
        setLoading(false);
      }
    }

    fetchDrivers();
  }, []);

  return { drivers, loading, error };
}
