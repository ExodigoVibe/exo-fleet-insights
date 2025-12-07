import { useMemo } from "react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { useVehicleRequestsQuery } from "@/hooks/queries/useVehicleRequestsQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Calendar() {
  const { data: requests = [], isLoading } = useVehicleRequestsQuery();

  // Group requests by date
  const requestsByDate = useMemo(() => {
    const grouped: Record<string, typeof requests> = {};
    requests.forEach((req) => {
      const dateKey = req.start_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(req);
    });
    return grouped;
  }, [requests]);

  // Get all unique dates sorted
  const sortedDates = useMemo(() => {
    return Object.keys(requestsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [requestsByDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Request Calendar</h1>
          <p className="text-muted-foreground">View vehicle requests organized by date</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span className="text-sm text-foreground">Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary/30 border border-primary/50" />
          <span className="text-sm text-foreground">Tentative (Pending/Rejected)</span>
        </div>
      </div>

      {/* Requests by Date */}
      <div className="space-y-4">
        {sortedDates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No vehicle requests found.
            </CardContent>
          </Card>
        ) : (
          sortedDates.map((date) => {
            const dateRequests = requestsByDate[date];
            const approvedCount = dateRequests.filter((r) => r.status === "approved").length;
            const pendingCount = dateRequests.filter((r) => r.status === "pending_manager").length;
            const rejectedCount = dateRequests.filter((r) => r.status === "rejected").length;

            return (
              <Card key={date} className="overflow-hidden">
                <CardHeader className="pb-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {approvedCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground">
                          {approvedCount} Approved
                        </Badge>
                      )}
                      {pendingCount > 0 && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                          {pendingCount} Pending
                        </Badge>
                      )}
                      {rejectedCount > 0 && (
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                          {rejectedCount} Rejected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Employee</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Department</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Purpose</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dateRequests.map((req) => {
                        const isApproved = req.status === "approved";
                        return (
                          <tr
                            key={req.id}
                            className={cn(
                              "border-b last:border-b-0 transition-colors",
                              isApproved
                                ? "bg-primary/10 hover:bg-primary/15"
                                : "bg-primary/5 hover:bg-primary/10 opacity-70"
                            )}
                          >
                            <td className="p-3">
                              <div className="font-medium text-foreground">{req.full_name}</div>
                              <div className="text-xs text-muted-foreground">{req.email}</div>
                            </td>
                            <td className="p-3 text-sm text-foreground">{req.department}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="capitalize">
                                {req.usage_type.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-foreground max-w-[200px] truncate">
                              {req.purpose || "-"}
                            </td>
                            <td className="p-3">
                              <Badge
                                className={cn(
                                  req.status === "approved" && "bg-green-600 text-white",
                                  req.status === "pending_manager" && "bg-yellow-500 text-white",
                                  req.status === "rejected" && "bg-red-600 text-white"
                                )}
                              >
                                {req.status === "pending_manager" ? "Pending" : req.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge
                                variant="outline"
                                className={cn(
                                  req.priority === "high" && "border-red-300 text-red-700 bg-red-50",
                                  req.priority === "medium" && "border-yellow-300 text-yellow-700 bg-yellow-50",
                                  req.priority === "low" && "border-green-300 text-green-700 bg-green-50"
                                )}
                              >
                                {req.priority}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
