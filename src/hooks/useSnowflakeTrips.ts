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

        const { data, error: functionError } = await supabase.functions.invoke(
          "snowflake-query",
          {
            body: {
              query: "SELECT * FROM BUSINESS_DB.ITURAN.TRIPS",
            },
          }
        );

        if (functionError) throw functionError;
        if (!data) throw new Error("No data returned from Snowflake");

        const response = data as SnowflakeResponse;
        
        // Map column names to indices
        const columnMap: Record<string, number> = {};
        response.columns.forEach((col, idx) => {
          columnMap[col.name] = idx;
        });

        // Transform Snowflake rows to Trip objects
        const transformedTrips: Trip[] = response.rows.map((row) => {
          try {
            // Parse JSON fields if they exist
            const startLocation = row[columnMap["START_LOCATION"]] 
              ? JSON.parse(row[columnMap["START_LOCATION"]])
              : null;
            const endLocation = row[columnMap["END_LOCATION"]] 
              ? JSON.parse(row[columnMap["END_LOCATION"]])
              : null;
            const safety = row[columnMap["SAFETY"]] 
              ? JSON.parse(row[columnMap["SAFETY"]])
              : { safety_grade: 0, fuel_grade: 0, safety_events_count: 0 };

            return {
              trip_id: parseInt(row[columnMap["TRIP_ID"]] || "0"),
              license_plate: row[columnMap["LICENSE_PLATE"]] || "",
              driver_code: parseInt(row[columnMap["DRIVER_CODE"]] || "0"),
              driver_name: row[columnMap["DRIVER_NAME"]] || "",
              driver_source: parseInt(row[columnMap["DRIVER_SOURCE"]] || "0"),
              start_location: startLocation || {
                location: {
                  point: { lat: 0, lon: 0 },
                  address: { location: "Unknown" },
                },
                odometer: 0,
                timestamp: new Date().toISOString(),
              },
              end_location: endLocation || {
                location: {
                  point: { lat: 0, lon: 0 },
                  address: { location: "Unknown" },
                },
                odometer: 0,
                timestamp: new Date().toISOString(),
              },
              duration_in_seconds: parseInt(row[columnMap["DURATION_IN_SECONDS"]] || "0"),
              distance: parseFloat(row[columnMap["DISTANCE"]] || "0"),
              max_speed: parseInt(row[columnMap["MAX_SPEED"]] || "0"),
              idle_duration_in_minutes: parseInt(row[columnMap["IDLE_DURATION_IN_MINUTES"]] || "0"),
              safety,
              trip_status: row[columnMap["TRIP_STATUS"]] || "trip_end",
            };
          } catch (parseError) {
            console.error("Error parsing trip row:", parseError, row);
            // Return null for failed rows and filter them out later
            return null;
          }
        }).filter((trip): trip is Trip => trip !== null);

        setTrips(transformedTrips);
      } catch (err) {
        console.error("Error fetching trips from Snowflake:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch trips");
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, []);

  return { trips, loading, error };
}
