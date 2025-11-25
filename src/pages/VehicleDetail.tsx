import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/fleet/KPICard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useSnowflakeTrips } from "@/hooks/useSnowflakeTrips";
import { useSnowflakeVehicles } from "@/hooks/useSnowflakeVehicles";
import { formatDuration } from "@/utils/fleetCalculations";
import { ArrowLeft, Activity, Clock, TrendingUp, Gauge, Shield, Loader2 } from "lucide-react";

const VehicleDetail = () => {
  const { licensePlate } = useParams<{ licensePlate: string }>();
  const { trips: allTrips, loading: tripsLoading } = useSnowflakeTrips();
  const { vehicles: allVehicles, loading: vehiclesLoading } = useSnowflakeVehicles();

  const isLoading = tripsLoading || vehiclesLoading;
  const vehicle = allVehicles.find((v) => v.license_plate === licensePlate);
  const vehicleTrips = allTrips.filter((t) => t.license_plate === licensePlate);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading vehicle data...</span>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Vehicle not found</h2>
          <Link to="/">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalActiveTime = vehicleTrips.reduce(
    (sum, trip) => sum + (trip.duration_in_seconds / 60 - trip.idle_duration_in_minutes),
    0
  );
  const totalIdleTime = vehicleTrips.reduce((sum, trip) => sum + trip.idle_duration_in_minutes, 0);
  const totalDistance = vehicleTrips.reduce((sum, trip) => sum + trip.distance, 0);
  const avgSafetyGrade =
    vehicleTrips.length > 0
      ? vehicleTrips.reduce((sum, trip) => sum + trip.safety.safety_grade, 0) / vehicleTrips.length
      : 0;
  const avgFuelGrade =
    vehicleTrips.length > 0
      ? vehicleTrips.reduce((sum, trip) => sum + trip.safety.fuel_grade, 0) / vehicleTrips.length
      : 0;

  const dailyData = vehicleTrips.reduce((acc, trip) => {
    const date = new Date(trip.start_location.timestamp).toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = { date, active: 0, idle: 0 };
    }
    acc[date].active += trip.duration_in_seconds / 60 - trip.idle_duration_in_minutes;
    acc[date].idle += trip.idle_duration_in_minutes;
    return acc;
  }, {} as Record<string, { date: string; active: number; idle: number }>);

  const chartData = Object.values(dailyData)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Active: parseFloat((d.active / 60).toFixed(1)),
      Idle: parseFloat((d.idle / 60).toFixed(1)),
    }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{vehicle.nickname}</h1>
              <p className="text-muted-foreground mt-1">
                {vehicle.make_name} {vehicle.model_name} {vehicle.model_year} • {vehicle.license_plate}
              </p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-muted-foreground">Color: {vehicle.color}</span>
                <span className="text-muted-foreground">VIN: {vehicle.vin}</span>
                <span className={`font-medium ${vehicle.motion_status === "driving" ? "text-success" : "text-muted-foreground"}`}>
                  Status: {vehicle.motion_status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <KPICard
            title="Active Time"
            value={formatDuration(totalActiveTime)}
            icon={Activity}
          />
          <KPICard
            title="Idle Time"
            value={formatDuration(totalIdleTime)}
            icon={Clock}
          />
          <KPICard
            title="Total Trips"
            value={vehicleTrips.length}
            icon={TrendingUp}
          />
          <KPICard
            title="Total Distance"
            value={`${totalDistance.toFixed(0)} km`}
            icon={Gauge}
          />
          <KPICard
            title="Avg Safety Grade"
            value={avgSafetyGrade.toFixed(0)}
            icon={Shield}
            subtitle={`Fuel: ${avgFuelGrade.toFixed(0)}`}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daily Active vs Idle Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="Active" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Idle" stackId="a" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trip History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Idle</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Safety</TableHead>
                    <TableHead>Start Address</TableHead>
                    <TableHead>End Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleTrips.slice(0, 20).map((trip) => (
                    <TableRow key={trip.trip_id}>
                      <TableCell>
                        {new Date(trip.start_location.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{trip.driver_name}</TableCell>
                      <TableCell>
                        {new Date(trip.start_location.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        {new Date(trip.end_location.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>{formatDuration(trip.duration_in_seconds / 60)}</TableCell>
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
                      <TableCell className="max-w-xs truncate text-sm">
                        {trip.start_location.location.address.location}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {trip.end_location.location.address.location}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default VehicleDetail;
