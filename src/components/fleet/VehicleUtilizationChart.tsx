import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { VehicleUsageMetrics } from "@/types/fleet";

interface VehicleUtilizationChartProps {
  metrics: VehicleUsageMetrics[];
}

export function VehicleUtilizationChart({ metrics }: VehicleUtilizationChartProps) {
  const vehicleData = metrics.reduce((acc, m) => {
    const existing = acc.find((v) => v.license_plate === m.license_plate);
    if (existing) {
      existing.active_time_hours += m.active_time_minutes / 60;
      existing.idle_time_hours += m.idle_time_minutes / 60;
    } else {
      acc.push({
        license_plate: m.license_plate,
        nickname: m.nickname,
        active_time_hours: m.active_time_minutes / 60,
        idle_time_hours: m.idle_time_minutes / 60,
      });
    }
    return acc;
  }, [] as Array<{ license_plate: string; nickname: string; active_time_hours: number; idle_time_hours: number }>);

  const chartData = vehicleData.map((v) => ({
    name: v.nickname || v.license_plate,
    "Active Time": parseFloat(v.active_time_hours.toFixed(1)),
    "Idle Time": parseFloat(v.idle_time_hours.toFixed(1)),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Bar dataKey="Active Time" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Idle Time" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
