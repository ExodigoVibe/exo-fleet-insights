import { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Trip } from "@/types/fleet";
import { formatDuration } from "@/utils/fleetCalculations";

interface TripsTableProps {
  trips: Trip[];
  loading?: boolean;
}

type SortField =
  | "date"
  | "license_plate"
  | "driver_name"
  | "duration_in_minutes"
  | "idle_duration_in_minutes"
  | "distance"
  | "safety_grade";

type SortDirection = "asc" | "desc";

export function TripsTable({ trips, loading = false }: TripsTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedTrips = useMemo(() => {
    // Filter out trips with distance = 0
    const filteredTrips = trips.filter((trip) => trip.distance > 0);
    
    const tripsWithDerivedFields = filteredTrips.map((trip) => {
      const date = new Date(trip.start_location.timestamp).toISOString().split("T")[0];
      const durationInMinutes = trip.duration_in_seconds / 60;
      return {
        ...trip,
        _date: date,
        _duration_in_minutes: durationInMinutes,
      };
    });

    const sorted = [...tripsWithDerivedFields].sort((a, b) => {
      const modifier = sortDirection === "asc" ? 1 : -1;

      switch (sortField) {
        case "date":
          return a._date.localeCompare(b._date) * modifier;
        case "license_plate":
          return a.license_plate.localeCompare(b.license_plate) * modifier;
        case "driver_name":
          return a.driver_name.localeCompare(b.driver_name) * modifier;
        case "duration_in_minutes":
          return (a._duration_in_minutes - b._duration_in_minutes) * modifier;
        case "idle_duration_in_minutes":
          return (a.idle_duration_in_minutes - b.idle_duration_in_minutes) * modifier;
        case "distance":
          return (a.distance - b.distance) * modifier;
        case "safety_grade":
          return (a.safety.safety_grade - b.safety.safety_grade) * modifier;
        default:
          return 0;
      }
    });

    return sorted;
  }, [trips, sortField, sortDirection]);

  // Reset to first page when trips change
  useEffect(() => {
    setCurrentPage(1);
  }, [trips]);

  const totalPages = Math.max(1, Math.ceil(sortedTrips.length / itemsPerPage));
  const paginatedTrips = sortedTrips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 hover:bg-muted/50"
      onClick={() => handleSort(field)}
      disabled={loading}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Filtered Trips</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="date">Date</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="license_plate">License Plate</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="driver_name">Driver</SortButton>
                </TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Start Location</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>End Location</TableHead>
                <TableHead>
                  <SortButton field="duration_in_minutes">Duration</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="idle_duration_in_minutes">Idle</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="distance">Distance (km)</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="safety_grade">Safety</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrips.map((trip) => (
                <TableRow key={`${trip.trip_id}-${trip.start_location.timestamp}`}>
                  <TableCell className="font-medium">
                    {new Date(trip.start_location.timestamp).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{trip.license_plate}</TableCell>
                  <TableCell>{trip.driver_name}</TableCell>
                  <TableCell>
                    {new Date(trip.start_location.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {trip.start_location.location.address.location || "—"}
                  </TableCell>
                  <TableCell>
                    {new Date(trip.end_location.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {trip.end_location.location.address.location || "—"}
                  </TableCell>
                  <TableCell className="text-success font-medium">
                    {formatDuration(trip.duration_in_seconds / 60)}
                  </TableCell>
                  <TableCell className="text-warning">
                    {formatDuration(trip.idle_duration_in_minutes)}
                  </TableCell>
                  <TableCell>{trip.distance.toFixed(1)} km</TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        trip.safety.safety_grade >= 90
                          ? "text-success"
                          : trip.safety.safety_grade >= 70
                          ? "text-warning"
                          : "text-destructive"
                      }`}
                    >
                      {trip.safety.safety_grade.toFixed(0)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, sortedTrips.length)} of{" "}
            {sortedTrips.length.toLocaleString()} trips
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={loading || currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={loading || currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


