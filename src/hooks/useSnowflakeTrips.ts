import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trip } from "@/types/fleet";

interface SnowflakeResponse {
  columns: Array<{ name: string }>;
  rows: any[][];
}

const CHUNK_SIZE = 100;
const INITIAL_LOAD = 30;

export function useSnowflakeTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Helper function to convert Snowflake timestamp to ISO string
  const parseSnowflakeTimestamp = (timestamp: any): string => {
    if (!timestamp) return new Date().toISOString();
    
    // If it's already a valid ISO string, return it
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // Handle Snowflake format "YYYY-MM-DD HH:MM:SS"
    const snowflakeFormat = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/;
    const match = String(timestamp).match(snowflakeFormat);
    
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
      return isoString;
    }
    
    // Fallback to current date if parsing fails
    console.warn("Failed to parse timestamp:", timestamp);
    return new Date().toISOString();
  };

  const fetchTripsChunk = useCallback(async (offset: number, limit: number) => {
    const { data, error: functionError } = await supabase.functions.invoke(
      "snowflake-query",
      {
        body: {
          query: `SELECT * FROM BUSINESS_DB.ITURAN.TRIPS ORDER BY START_TIMESTAMP DESC LIMIT ${limit} OFFSET ${offset}`,
        },
      }
    );

    if (functionError) throw functionError;
    if (!data) throw new Error("No data returned from Snowflake");

    const response = data as SnowflakeResponse;
    
    // Transform Snowflake rows to Trip objects
    return response.rows.map((row): Trip => ({
      trip_id: parseInt(row[0] || "0"),
      license_plate: row[1] || "",
      driver_code: parseInt(row[2] || "0"),
      driver_name: `${row[3] || ""} ${row[4] || ""}`.trim(),
      driver_source: parseInt(row[5] || "0"),
      start_location: {
        location: {
          point: { 
            lat: parseFloat(row[6]) || 0, 
            lon: parseFloat(row[7]) || 0 
          },
          address: { 
            location: row[8] || "", 
            speedlimit: parseInt(row[9]) || undefined 
          },
        },
        odometer: parseFloat(row[10]) || 0,
        timestamp: parseSnowflakeTimestamp(row[11]),
      },
      end_location: {
        location: {
          point: { 
            lat: parseFloat(row[12]) || 0, 
            lon: parseFloat(row[13]) || 0 
          },
          address: { 
            location: row[14] || "" 
          },
        },
        odometer: parseFloat(row[15]) || 0,
        timestamp: parseSnowflakeTimestamp(row[16]),
      },
      duration_in_seconds: parseInt(row[17]) || 0,
      distance: parseFloat(row[18]) || 0,
      max_speed: parseInt(row[19]) || 0,
      idle_duration_in_minutes: parseInt(row[20]) || 0,
      safety: {
        safety_grade: parseFloat(row[21]) || 0,
        fuel_grade: parseFloat(row[22]) || 0,
        safety_events_count: parseInt(row[23]) || 0,
      },
      trip_status: row[24] || "trip_end",
    }));
  }, []);

  const loadMoreTrips = useCallback(async () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const newTrips = await fetchTripsChunk(totalLoaded, CHUNK_SIZE);
      setTrips(prev => [...prev, ...newTrips]);
      setTotalLoaded(prev => prev + newTrips.length);
    } catch (err) {
      console.error("Error loading more trips:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [totalLoaded, isLoadingMore, fetchTripsChunk]);

  useEffect(() => {
    async function fetchInitialTrips() {
      try {
        setLoading(true);
        setError(null);

        // Load initial batch
        const initialTrips = await fetchTripsChunk(0, INITIAL_LOAD);
        setTrips(initialTrips);
        setTotalLoaded(INITIAL_LOAD);
        setLoading(false);

        // Start background loading after initial render
        setTimeout(async () => {
          let offset = INITIAL_LOAD;
          let hasMore = true;

          while (hasMore) {
            try {
              const chunk = await fetchTripsChunk(offset, CHUNK_SIZE);
              if (chunk.length === 0) {
                hasMore = false;
              } else {
                setTrips(prev => [...prev, ...chunk]);
                setTotalLoaded(prev => prev + chunk.length);
                offset += CHUNK_SIZE;
                // Small delay to avoid overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            } catch (err) {
              console.error("Background loading error:", err);
              hasMore = false;
            }
          }
        }, 100);

      } catch (err) {
        console.error("Error fetching trips from Snowflake:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch trips");
        setLoading(false);
      }
    }

    fetchInitialTrips();
  }, [fetchTripsChunk]);

  return { trips, loading, error, totalLoaded, loadMoreTrips, isLoadingMore };
}
