import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Vehicle } from "@/types/fleet";

interface SnowflakeResponse {
  columns: Array<{ name: string }>;
  rows: any[][];
}

export function useSnowflakeVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: functionError } = await supabase.functions.invoke(
          "snowflake-query",
          {
            body: {
              query: "SELECT * FROM BUSINESS_DB.ITURAN.VEHICLES",
            },
          }
        );

        if (functionError) throw functionError;
        if (!data) throw new Error("No data returned from Snowflake");

        const response = data as SnowflakeResponse;
        
        // Map column names to indices for better readability
        const columnMap: Record<string, number> = {};
        response.columns.forEach((col, idx) => {
          columnMap[col.name] = idx;
        });

        // Transform Snowflake rows to Vehicle objects
        const transformedVehicles: Vehicle[] = response.rows.map((row) => ({
          license_plate: row[columnMap["LICENSE_PLATE"]] || "",
          vehicle_id: parseInt(row[columnMap["VEHICLE_ID"]] || "0"),
          vin: row[columnMap["VIN"]] || "",
          nickname: row[columnMap["NICKNAME"]] || "",
          model_name: row[columnMap["MODEL_NAME"]] || "",
          make_name: row[columnMap["MAKE_NAME"]] || "",
          model_year: row[columnMap["MODEL_YEAR"]]?.toString() || "",
          color: row[columnMap["COLOR"]] || "",
          motion_status: row[columnMap["MOTION_STATUS"]] || "parking",
          telematics_units: row[columnMap["TELEMATICS_UNITS"]] 
            ? JSON.parse(row[columnMap["TELEMATICS_UNITS"]])
            : [{ ip_address: "unknown" }],
        }));

        setVehicles(transformedVehicles);
      } catch (err) {
        console.error("Error fetching vehicles from Snowflake:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch vehicles");
      } finally {
        setLoading(false);
      }
    }

    fetchVehicles();
  }, []);

  return { vehicles, loading, error };
}
