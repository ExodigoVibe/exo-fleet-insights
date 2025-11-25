import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DailyUsageMetrics } from "@/types/fleet";

interface DailyUsageChartProps {
  metrics: DailyUsageMetrics[];
}

export function DailyUsageChart({ metrics }: DailyUsageChartProps) {
  const chartData = metrics.map((m) => ({
    date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    "Active Time": parseFloat((m.active_time_minutes / 60).toFixed(1)),
    "Idle Time": parseFloat((m.idle_time_minutes / 60).toFixed(1)),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Usage Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
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
            <Legend />
            <Line
              type="monotone"
              dataKey="Active Time"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))" }}
            />
            <Line
              type="monotone"
              dataKey="Idle Time"
              stroke="hsl(var(--warning))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--warning))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
