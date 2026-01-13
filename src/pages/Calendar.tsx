import { useState, useMemo } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useVehicleRequestsQuery, VehicleRequest } from "@/hooks/queries/useVehicleRequestsQuery";
import { useVehicleAssignmentsQuery, VehicleAssignment } from "@/hooks/queries/useVehicleAssignmentsQuery";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, parseISO, isWithinInterval } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  status: string;
  type: 'request' | 'assignment';
  request?: VehicleRequest;
  assignment?: VehicleAssignment;
}

const Calendar = () => {
  const navigate = useNavigate();
  const { data: requests = [], isLoading: requestsLoading } = useVehicleRequestsQuery();
  const { data: assignments = [], isLoading: assignmentsLoading } = useVehicleAssignmentsQuery();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Map requests and assignments to calendar events
  const events = useMemo(() => {
    const requestEvents: CalendarEvent[] = requests.map((req) => ({
      id: req.id,
      title: req.full_name,
      date: parseISO(req.start_date),
      status: req.status,
      type: 'request' as const,
      request: req,
    }));

    // Only show assignments that have a driver assigned and a valid start_date
    const assignmentEvents: CalendarEvent[] = assignments
      .filter((assignment) => assignment.driver_id !== null && assignment.start_date !== null)
      .map((assignment) => ({
        id: assignment.id,
        title: `${assignment.license_plate}${assignment.driver_name ? ` - ${assignment.driver_name}` : ''}`,
        date: parseISO(assignment.start_date!),
        endDate: assignment.end_date ? parseISO(assignment.end_date) : undefined,
        status: assignment.status,
        type: 'assignment' as const,
        assignment,
      }));

    return [...requestEvents, ...assignmentEvents];
  }, [requests, assignments]);

  // Get calendar days for current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Get events for a specific day (including multi-day assignments)
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      if (event.type === 'assignment' && event.endDate) {
        // For assignments with date range, check if day falls within range
        return isWithinInterval(day, { start: event.date, end: event.endDate }) || 
               isSameDay(event.date, day) || 
               isSameDay(event.endDate, day);
      }
      return isSameDay(event.date, day);
    });
  };

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handlePrevYear = () => setCurrentMonth(prev => subMonths(prev, 12));
  const handleNextYear = () => setCurrentMonth(prev => addMonths(prev, 12));
  const handleToday = () => setCurrentMonth(new Date());

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
            <p className="text-sm text-muted-foreground">
              View and manage vehicle request schedules. Visibility is based on your role.
            </p>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevYear}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 py-2 bg-card border rounded-md min-w-[160px] text-center font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </div>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextYear}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(new Date(), 1))}>
              Next Month
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary" />
            <span className="text-sm text-muted-foreground">Approved Request</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-400/50 border border-yellow-500" />
            <span className="text-sm text-muted-foreground">Pending Request</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive/30 border border-destructive/50" />
            <span className="text-sm text-muted-foreground">Rejected Request</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-sm text-muted-foreground">Vehicle Assignment</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border rounded-lg bg-card overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {weekDays.map((day) => (
              <div key={day} className="px-2 py-3 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border-b border-r p-2 ${
                    !isCurrentMonth ? "bg-muted/30" : "bg-card"
                  } ${isCurrentDay ? "bg-primary/5" : ""}`}
                >
                  <div className={`text-sm mb-1 ${
                    !isCurrentMonth 
                      ? "text-muted-foreground/50" 
                      : isCurrentDay 
                        ? "text-primary font-bold" 
                        : "text-foreground"
                  }`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={`${event.type}-${event.id}`}
                        onClick={() => {
                          if (event.type === 'request') {
                            navigate(`/requests/${event.id}`);
                          } else if (event.assignment) {
                            navigate(`/vehicle-fleet/${event.assignment.license_plate}`);
                          }
                        }}
                        className={`text-xs px-2 py-1 rounded truncate cursor-pointer transition-opacity hover:opacity-80 flex items-center gap-1 ${
                          event.type === 'assignment'
                            ? "bg-blue-500 text-white"
                            : event.status === "approved"
                              ? "bg-primary text-primary-foreground"
                              : event.status === "rejected"
                                ? "bg-destructive/30 text-destructive border border-destructive/50"
                                : "bg-yellow-400/50 text-yellow-800 border border-yellow-500 dark:text-yellow-200"
                        }`}
                        title={`${event.title} - ${event.status}${event.type === 'assignment' ? ' (Vehicle Assignment)' : ''}`}
                      >
                        {event.type === 'assignment' && <Car className="h-3 w-3 flex-shrink-0" />}
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground px-2">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {(requestsLoading || assignmentsLoading) && (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
