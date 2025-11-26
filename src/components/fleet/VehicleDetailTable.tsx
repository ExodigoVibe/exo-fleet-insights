import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { VehicleUsageMetrics } from "@/types/fleet";
import { formatDuration } from "@/utils/fleetCalculations";
import { useNavigate } from "react-router-dom";

interface VehicleDetailTableProps {
  metrics: VehicleUsageMetrics[];
}

type SortField = keyof VehicleUsageMetrics;
type SortDirection = "asc" | "desc";

export function VehicleDetailTable({ metrics }: VehicleDetailTableProps) {
  const navigate = useNavigate();
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

  const sortedMetrics = [...metrics].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const modifier = sortDirection === "asc" ? 1 : -1;

    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal) * modifier;
    }
    if (typeof aVal === "number" && typeof bVal === "number") {
      return (aVal - bVal) * modifier;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedMetrics.length / itemsPerPage);
  const paginatedMetrics = sortedMetrics.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 hover:bg-muted/50"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Usage Details</CardTitle>
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
                  <SortButton field="nickname">Vehicle</SortButton>
                </TableHead>
                <TableHead>Make/Model/Year</TableHead>
                <TableHead>
                  <SortButton field="active_time_minutes">Active Time</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="idle_time_minutes">Idle Time</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="trips_count">Trips</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="total_distance">Distance (km)</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="avg_safety_grade">Safety</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMetrics.map((metric, idx) => (
                <TableRow
                  key={`${metric.license_plate}-${metric.date}-${idx}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/vehicle/${metric.license_plate}`)}
                >
                  <TableCell className="font-medium">
                    {new Date(metric.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{metric.license_plate}</TableCell>
                  <TableCell>{metric.nickname}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {metric.make_name} {metric.model_name} ({metric.model_year})
                  </TableCell>
                  <TableCell className="text-success font-medium">
                    {formatDuration(metric.active_time_minutes)}
                  </TableCell>
                  <TableCell className="text-warning font-medium">
                    {formatDuration(metric.idle_time_minutes)}
                  </TableCell>
                  <TableCell>{metric.trips_count}</TableCell>
                  <TableCell>{metric.total_distance.toFixed(1)}</TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        metric.avg_safety_grade >= 90
                          ? "text-success"
                          : metric.avg_safety_grade >= 70
                          ? "text-warning"
                          : "text-destructive"
                      }`}
                    >
                      {metric.avg_safety_grade.toFixed(0)}
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
            {Math.min(currentPage * itemsPerPage, sortedMetrics.length)} of {sortedMetrics.length}{" "}
            entries
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
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
