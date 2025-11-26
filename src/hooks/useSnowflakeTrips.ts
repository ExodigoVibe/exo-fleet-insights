import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trip } from "@/types/fleet";

interface SnowflakeResponse {
  columns: Array<{ name: string }>;
  rows: any[][];
  rowCount?: number;
}

interface UseSnowflakeTripsResult {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  loadedCount: number;
  totalCount: number;
}

const CHUNK_SIZE = 100;
const INITIAL_DISPLAY_COUNT = 30;

export function useSnowflakeTrips(): UseSnowflakeTripsResult {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function fetchTrips() {
      try {
        setLoading(true);
        setError(null);
        setTrips([]);
        setLoadedCount(0);

        const { data, error: functionError } = await supabase.functions.invoke(
          "snowflake-query",
          {
            body: {
              query: "SELECT * FROM BUSINESS_DB.ITURAN.TRIPS",
            },
          }
        );

        if (isCancelled) return;

        if (functionError) throw functionError;
        if (!data) throw new Error("No data returned from Snowflake");

        const response = data as SnowflakeResponse;

        const columnMap: Record<string, number> = {};
        response.columns.forEach((col, idx) => {
          columnMap[col.name.toUpperCase()] = idx;
        });

        const rows = response.rows || [];
        const total = response.rowCount ?? rows.length;
        setTotalCount(total);

        const mapRowToTrip = (row: any[]): Trip => {
          // NOTE: Adjust column names here to match your Snowflake TRIPS table schema
          const startTimestamp =
            row[columnMap["START_TIMESTAMP"]] ||
            row[columnMap["START_TIME"]] ||
            row[columnMap["START_DATE"]] ||
            new Date().toISOString();

          const endTimestamp =
            row[columnMap["END_TIMESTAMP"]] ||
            row[columnMap["END_TIME"]] ||
            startTimestamp;

          const distance = Number(
            row[columnMap["DISTANCE"]] ??
              row[columnMap["DISTANCE_KM"]] ??
              0
          );

          let durationSeconds = Number(
            row[columnMap["DURATION_IN_SECONDS"]] ??
              row[columnMap["DURATION"]] ??
              0
          );

          // Fallback: if duration is missing/zero but we have timestamps, compute it from start/end.
          if (
            (!durationSeconds || Number.isNaN(durationSeconds)) &&
            startTimestamp &&
            endTimestamp
          ) {
            const startMs = new Date(startTimestamp).getTime();
            const endMs = new Date(endTimestamp).getTime();
            if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs >= startMs) {
              durationSeconds = Math.round((endMs - startMs) / 1000);
            }
          }

          const idleMinutes = Number(
            row[columnMap["IDLE_DURATION_IN_MINUTES"]] ??
              row[columnMap["IDLE_MINUTES"]] ??
              0
          );

          const safetyGrade = Number(
            row[columnMap["SAFETY_GRADE"]] ??
              row[columnMap["SAFETY_SCORE"]] ??
              80
          );

          const fuelGrade = Number(
            row[columnMap["FUEL_GRADE"]] ??
              row[columnMap["FUEL_SCORE"]] ??
              80
          );

          return {
            trip_id: Number(
              row[columnMap["TRIP_ID"]] ?? row[columnMap["ID"]] ?? 0
            ),
            license_plate:
              row[columnMap["LICENSE_PLATE"]] ??
              row[columnMap["VEHICLE_LICENSE_PLATE"]] ??
              "",
            driver_code: Number(
              row[columnMap["DRIVER_CODE"]] ?? row[columnMap["DRIVER_ID"]] ?? 0
            ),
            driver_name:
              row[columnMap["DRIVER_NAME"]] ??
              row[columnMap["DRIVER_FULL_NAME"]] ??
              "Unknown Driver",
            driver_source: Number(
              row[columnMap["DRIVER_SOURCE"]] ??
                row[columnMap["DRIVER_SOURCE_ID"]] ??
                0
            ),
            start_location: {
              location: {
                point: {
                  lat: Number(
                    row[columnMap["START_LAT"]] ??
                      row[columnMap["START_LATITUDE"]] ??
                      0
                  ),
                  lon: Number(
                    row[columnMap["START_LON"]] ??
                      row[columnMap["START_LONGITUDE"]] ??
                      0
                  ),
                },
                address: {
                  location:
                    row[columnMap["START_ADDRESS"]] ??
                    row[columnMap["START_LOCATION"]] ??
                    "",
                  speedlimit: Number(
                    row[columnMap["START_SPEEDLIMIT"]] ??
                      row[columnMap["SPEED_LIMIT"]] ??
                      50
                  ),
                },
              },
              odometer: Number(
                row[columnMap["START_ODOMETER"]] ??
                  row[columnMap["ODOMETER_START"]] ??
                  0
              ),
              timestamp: new Date(startTimestamp).toISOString(),
            },
            end_location: {
              location: {
                point: {
                  lat: Number(
                    row[columnMap["END_LAT"]] ??
                      row[columnMap["END_LATITUDE"]] ??
                      0
                  ),
                  lon: Number(
                    row[columnMap["END_LON"]] ??
                      row[columnMap["END_LONGITUDE"]] ??
                      0
                  ),
                },
                address: {
                  location:
                    row[columnMap["END_ADDRESS"]] ??
                    row[columnMap["END_LOCATION"]] ??
                    "",
                },
              },
              odometer: Number(
                row[columnMap["END_ODOMETER"]] ??
                  row[columnMap["ODOMETER_END"]] ??
                  0
              ),
              timestamp: new Date(endTimestamp).toISOString(),
            },
            duration_in_seconds: durationSeconds,
            distance,
            max_speed: Number(
              row[columnMap["MAX_SPEED"]] ??
                row[columnMap["MAX_SPEED_KMH"]] ??
                0
            ),
            idle_duration_in_minutes: idleMinutes,
            safety: {
              safety_grade: safetyGrade,
              fuel_grade: fuelGrade,
              safety_events_count: Number(
                row[columnMap["SAFETY_EVENTS_COUNT"]] ??
                  row[columnMap["SAFETY_EVENTS"]] ??
                  0
              ),
            },
            trip_status:
              row[columnMap["TRIP_STATUS"]] ??
              row[columnMap["STATUS"]] ??
              "trip_end",
          };
        };

        // First, synchronously map the initial subset so the UI can render quickly.
        const initialCount = Math.min(INITIAL_DISPLAY_COUNT, rows.length);
        const initialRows = rows.slice(0, initialCount);
        const initialTrips = initialRows.map(mapRowToTrip);

        if (isCancelled) return;

        setTrips(initialTrips);
        setLoadedCount(initialTrips.length);

        // Then, process the remaining rows in background-sized chunks to avoid blocking the UI.
        let currentIndex = initialCount;

        const processNextChunk = () => {
          if (isCancelled || currentIndex >= rows.length) {
            setLoading(false);
            return;
          }

          const nextRows = rows.slice(
            currentIndex,
            currentIndex + CHUNK_SIZE
          );
          const nextTrips = nextRows.map(mapRowToTrip);

          setTrips((prev) => [...prev, ...nextTrips]);
          currentIndex += CHUNK_SIZE;
          setLoadedCount(currentIndex);

          // Yield back to the event loop so the UI stays responsive.
          setTimeout(processNextChunk, 0);
        };

        processNextChunk();
      } catch (err) {
        if (isCancelled) return;
        console.error("Error fetching trips from Snowflake:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch trips"
        );
        setLoading(false);
      }
    }

    fetchTrips();

    return () => {
      isCancelled = true;
    };
  }, []);

  return { trips, loading, error, loadedCount, totalCount };
}


