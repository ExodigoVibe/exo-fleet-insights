import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Filter, X, Check, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FleetFilters, Driver } from "@/types/fleet";
import { useInitialDateRange } from "@/hooks/useInitialData";

interface FilterPanelProps {
  filters: FleetFilters;
  onFiltersChange: (filters: FleetFilters) => void;
  drivers: string[];
  driversData?: Driver[];
  licensePlates: string[];
  userHistoryLicensePlates: string[];
  loading?: boolean;
}

export function FilterPanel({ filters, onFiltersChange, drivers, driversData = [], licensePlates, userHistoryLicensePlates, loading = false }: FilterPanelProps) {
  const [pendingFilters, setPendingFilters] = useState<FleetFilters>(filters);
  const { dateFrom, dateTo } = useInitialDateRange();

  const plateOptions = useMemo(() => {
    const arr = (drivers.length > 1 ? licensePlates : userHistoryLicensePlates) ?? [];
    // de-dupe + remove falsy
    return Array.from(new Set(arr.map(p => (p ?? "").trim()).filter(Boolean)));
  }, [drivers.length, licensePlates, userHistoryLicensePlates]);

  const selectedPlate = useMemo(() => {
    const current = pendingFilters.licensePlates?.[0];
    if (!current) return "all";
    return plateOptions.includes(current) ? current : "all";
  }, [pendingFilters.licensePlates, plateOptions]);
  
  useEffect(() => {
    setPendingFilters(filters);
  }, [filters]);

  const handleReset = () => {
    const defaultFilters: FleetFilters = {
      dateFrom,
      dateTo,
      drivers: [],
      vehicles: [],
      licensePlates: [],
      safetyGradeMin: 0,
      safetyGradeMax: 100,
      tripStatus: [],
      driverStatus: 'all',
    };
    setPendingFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const handleApply = () => {
    onFiltersChange(pendingFilters);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={loading}>
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button variant="default" size="sm" onClick={handleApply} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" />
                Apply
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={pendingFilters.dateFrom}
                onChange={(e) =>
                  setPendingFilters({ ...pendingFilters, dateFrom: e.target.value })
                }
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={pendingFilters.dateTo}
                onChange={(e) =>
                  setPendingFilters({ ...pendingFilters, dateTo: e.target.value })
                }
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver">Driver</Label>
              <Select
                value={pendingFilters.drivers[0] || (drivers.length === 1 ? drivers[0] : "all")}
                onValueChange={(value) =>
                  setPendingFilters({
                    ...pendingFilters,
                    drivers: value === "all" ? [] : [value],
                  })
                }
                disabled={loading || drivers.length <= 1}
              >
                <SelectTrigger disabled={loading || drivers.length <= 1}>
                  <SelectValue placeholder={drivers.length === 0 ? "No matching driver" : drivers.length === 1 ? drivers[0] : "All Drivers"} />
                </SelectTrigger>
                {drivers.length > 1 ? (
                  <SelectContent>
                    <SelectItem value="all">All Drivers ({drivers.length})</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver} value={driver}>
                        {driver}
                      </SelectItem>
                    ))}
                  </SelectContent>
                ) : drivers.length === 1 ? (
                  <SelectContent>
                    <SelectItem value={drivers[0]}>
                      {drivers[0]}
                    </SelectItem>
                  </SelectContent>
                ) : (
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      No matching driver
                    </SelectItem>
                  </SelectContent>
                )}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate</Label>
              <Select
                value={selectedPlate}
                onValueChange={(value) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    licensePlates: value === "all" ? [] : [value],
                  }))
                }
                disabled={loading || plateOptions.length === 0}
              >
              <SelectTrigger>
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Vehicles ({plateOptions.length})</SelectItem>

                {plateOptions.map((plate) => (
                  <SelectItem key={plate} value={plate}>
                    {plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="driverStatus">Driver Status</Label>
              <Select
                value={pendingFilters.driverStatus || 'all'}
                onValueChange={(value: 'all' | 'active' | 'blocked') =>
                  setPendingFilters({
                    ...pendingFilters,
                    driverStatus: value,
                  })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active (Not Blocked)</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>
              Safety Grade Range: {pendingFilters.safetyGradeMin} - {pendingFilters.safetyGradeMax}
            </Label>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[pendingFilters.safetyGradeMin, pendingFilters.safetyGradeMax]}
              onValueChange={([min, max]) =>
                setPendingFilters({
                  ...pendingFilters,
                  safetyGradeMin: min,
                  safetyGradeMax: max,
                })
              }
              className="w-full"
              disabled={loading}
            />
          </div>
      </CardContent>
    </Card>
  );
}
