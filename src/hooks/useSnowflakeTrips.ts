import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trip } from "@/types/fleet";

interface SnowflakeResponse {
  columns: Array<{ name: string }>;
  rows: any[][];
}

export function useSnowflakeTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrips() {
      try {
        setLoading(true);
        setError(null);
        console.log("[useSnowflakeTrips] Starting fetch...");

        const { data, error: functionError } = await supabase.functions.invoke(
          "snowflake-query",
          {
            body: {
              query: "SELECT * FROM BUSINESS_DB.ITURAN.TRIPS LIMIT 100",
            },
          }
        );

        if (functionError) {
          console.error("[useSnowflakeTrips] Function error:", functionError);
          throw functionError;
        }
        
        if (!data) {
          console.error("[useSnowflakeTrips] No data returned");
          throw new Error("No data returned from Snowflake");
        }

        console.log("[useSnowflakeTrips] Received data, processing...");
        const response = data as SnowflakeResponse;
        
        // Map column names to indices
        const columnMap: Record<string, number> = {};
        response.columns.forEach((col, idx) => {
          columnMap[col.name] = idx;
        });

        // Transform Snowflake rows to Trip objects
        const transformedTrips: Trip[] = response.rows.map((row) => {
          return {
            trip_id: parseInt(row[columnMap["TRIP_ID"]] || "0"),
            license_plate: row[columnMap["LICENSE_PLATE"]] || "",
            driver_code: parseInt(row[columnMap["DRIVER_CODE"]] || "0"),
            driver_name: row[columnMap["DRIVER_NAME"]] || "",
            driver_source: parseInt(row[columnMap["DRIVER_SOURCE"]] || "0"),
            start_location: {
              location: {
                point: { 
                  lat: parseFloat(row[columnMap["START_LAT"]] || "0"), 
                  lon: parseFloat(row[columnMap["START_LON"]] || "0") 
                },
                address: { 
                  location: row[columnMap["START_ADDRESS"]] || "Unknown",
                  speedlimit: parseInt(row[columnMap["START_SPEEDLIMIT"]] || "0")
                },
              },
              odometer: parseFloat(row[columnMap["START_ODOMETER"]] || "0"),
              timestamp: row[columnMap["START_TIMESTAMP"]] || new Date().toISOString(),
            },
            end_location: {
              location: {
                point: { 
                  lat: parseFloat(row[columnMap["END_LAT"]] || "0"), 
                  lon: parseFloat(row[columnMap["END_LON"]] || "0") 
                },
                address: { 
                  location: row[columnMap["END_ADDRESS"]] || "Unknown"
                },
              },
              odometer: parseFloat(row[columnMap["END_ODOMETER"]] || "0"),
              timestamp: row[columnMap["END_TIMESTAMP"]] || new Date().toISOString(),
            },
            duration_in_seconds: parseInt(row[columnMap["DURATION_SECONDS"]] || "0"),
            distance: parseFloat(row[columnMap["DISTANCE"]] || "0"),
            max_speed: parseInt(row[columnMap["MAX_SPEED"]] || "0"),
            idle_duration_in_minutes: parseInt(row[columnMap["IDLE_MINUTES"]] || "0"),
            safety: {
              safety_grade: parseFloat(row[columnMap["SAFETY_GRADE"]] || "0"),
              fuel_grade: parseInt(row[columnMap["FUEL_GRADE"]] || "0"),
              safety_events_count: parseInt(row[columnMap["SAFETY_EVENTS_COUNT"]] || "0"),
            },
            trip_status: row[columnMap["TRIP_STATUS"]] || "trip_end",
          };
        });

        console.log(`[useSnowflakeTrips] Successfully transformed ${transformedTrips.length} trips`);
        setTrips(transformedTrips);
      } catch (err) {
        console.error("[useSnowflakeTrips] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch trips");
        setTrips([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, []);

  return { trips, loading, error };
}
