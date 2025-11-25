import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trip } from "@/types/fleet";

interface SnowflakeResponse {
  columns: Array<{ name: string; type: string }>;
  rows: any[][];
}

const CHUNK_SIZE = 1000;

export function useSnowflakeTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    async function fetchTripsInChunks() {
      try {
        setLoading(true);
        setError(null);
        
        // First, get the total count
        const countQuery = "SELECT COUNT(*) as total FROM BUSINESS_DB.ITURAN.TRIPS";
        const { data: countData, error: countError } = await supabase.functions.invoke(
          "snowflake-query",
          {
            body: { query: countQuery },
          }
        );

        if (countError) throw countError;

        const countResult = countData as SnowflakeResponse;
        const totalTrips = countResult.rows[0]?.[0] || 0;
        setProgress({ current: 0, total: totalTrips });

        // Fetch trips in chunks
        const allTrips: Trip[] = [];
        let offset = 0;
        
        while (offset < totalTrips) {
          const query = `SELECT * FROM BUSINESS_DB.ITURAN.TRIPS LIMIT ${CHUNK_SIZE} OFFSET ${offset}`;
          
          const { data, error: chunkError } = await supabase.functions.invoke(
            "snowflake-query",
            {
              body: { query },
            }
          );

          if (chunkError) throw chunkError;

          const result = data as SnowflakeResponse;
          
          // Map column names to indices
          const columnMap = new Map<string, number>();
          result.columns.forEach((col, idx) => {
            columnMap.set(col.name, idx);
          });

          // Transform rows to Trip objects
          const chunkTrips: Trip[] = result.rows.map((row) => {
            const getVal = (key: string) => row[columnMap.get(key) || 0];
            
            return {
              trip_id: getVal("TRIP_ID") || 0,
              license_plate: getVal("LICENSE_PLATE") || "",
              driver_code: getVal("DRIVER_CODE") || 0,
              driver_name: getVal("DRIVER_NAME") || "Unknown Driver",
              driver_source: getVal("DRIVER_SOURCE") || 0,
              start_location: {
                location: {
                  point: {
                    lat: getVal("START_LAT") || 0,
                    lon: getVal("START_LON") || 0,
                  },
                  address: {
                    location: getVal("START_ADDRESS") || "",
                    speedlimit: getVal("START_SPEEDLIMIT"),
                  },
                },
                odometer: getVal("START_ODOMETER") || 0,
                timestamp: getVal("START_TIMESTAMP") || new Date().toISOString(),
              },
              end_location: {
                location: {
                  point: {
                    lat: getVal("END_LAT") || 0,
                    lon: getVal("END_LON") || 0,
                  },
                  address: {
                    location: getVal("END_ADDRESS") || "",
                  },
                },
                odometer: getVal("END_ODOMETER") || 0,
                timestamp: getVal("END_TIMESTAMP") || new Date().toISOString(),
              },
              duration_in_seconds: getVal("DURATION_IN_SECONDS") || 0,
              distance: getVal("DISTANCE") || 0,
              max_speed: getVal("MAX_SPEED") || 0,
              idle_duration_in_minutes: getVal("IDLE_DURATION_IN_MINUTES") || 0,
              safety: {
                safety_grade: getVal("SAFETY_GRADE") || 0,
                fuel_grade: getVal("FUEL_GRADE") || 0,
                safety_events_count: getVal("SAFETY_EVENTS_COUNT") || 0,
              },
              trip_status: getVal("TRIP_STATUS") || "trip_end",
            };
          });

          allTrips.push(...chunkTrips);
          offset += CHUNK_SIZE;
          setProgress({ current: allTrips.length, total: totalTrips });
          
          // Update state progressively so UI shows data as it loads
          setTrips([...allTrips]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching trips from Snowflake:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch trips");
        setLoading(false);
      }
    }

    fetchTripsInChunks();
  }, []);

  return { trips, loading, error, progress };
}
