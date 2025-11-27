import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FleetFilters } from "@/types/fleet";

interface FilterPanelProps {
  filters: FleetFilters;
  onFiltersChange: (filters: FleetFilters) => void;
  drivers: string[];
  licensePlates: string[];
  loading?: boolean;
}

export function FilterPanel({ filters, onFiltersChange, drivers, licensePlates, loading = false }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleReset = () => {
    const defaultFilters: FleetFilters = {
      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      dateTo: new Date().toISOString().split("T")[0],
      drivers: [],
      vehicles: [],
      licensePlates: [],
      safetyGradeMin: 0,
      safetyGradeMax: 100,
      tripStatus: [],
    };
    onFiltersChange(defaultFilters);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  onFiltersChange({ ...filters, dateFrom: e.target.value })
                }
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  onFiltersChange({ ...filters, dateTo: e.target.value })
                }
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver">Driver</Label>
              <Select
                value={filters.drivers[0] || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    drivers: value === "all" ? [] : [value],
                  })
                }
                disabled={loading}
              >
                <SelectTrigger disabled={loading}>
                  <SelectValue placeholder="All Drivers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers ({drivers.length})</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver} value={driver}>
                      {driver}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate</Label>
              <Select
                value={filters.licensePlates[0] || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    licensePlates: value === "all" ? [] : [value],
                  })
                }
                disabled={loading}
              >
                <SelectTrigger disabled={loading}>
                  <SelectValue placeholder="All Vehicles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles ({licensePlates.length})</SelectItem>
                  {licensePlates.map((plate) => (
                    <SelectItem key={plate} value={plate}>
                      {plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>
              Safety Grade Range: {filters.safetyGradeMin} - {filters.safetyGradeMax}
            </Label>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[filters.safetyGradeMin, filters.safetyGradeMax]}
              onValueChange={([min, max]) =>
                onFiltersChange({
                  ...filters,
                  safetyGradeMin: min,
                  safetyGradeMax: max,
                })
              }
              className="w-full"
              disabled={loading}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
