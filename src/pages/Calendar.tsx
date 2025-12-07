import { useState, useMemo } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useVehicleRequestsQuery, VehicleRequest } from "@/hooks/queries/useVehicleRequestsQuery";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, parseISO } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  status: string;
  request: VehicleRequest;
}

const Calendar = () => {
  const navigate = useNavigate();
  const { data: requests = [], isLoading } = useVehicleRequestsQuery();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Map requests to calendar events
  const events = useMemo(() => {
    return requests.map((req): CalendarEvent => ({
      id: req.id,
      title: req.full_name,
      date: parseISO(req.start_date),
      status: req.status,
      request: req,
    }));
  }, [requests]);

  // Get calendar days for current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day));
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
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary" />
            <span className="text-sm text-muted-foreground">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-400/50 border border-yellow-500" />
            <span className="text-sm text-muted-foreground">Pending (Tentative)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive/30 border border-destructive/50" />
            <span className="text-sm text-muted-foreground">Rejected</span>
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
                        key={event.id}
                        onClick={() => navigate(`/requests/${event.id}`)}
                        className={`text-xs px-2 py-1 rounded truncate cursor-pointer transition-opacity hover:opacity-80 ${
                          event.status === "approved"
                            ? "bg-primary text-primary-foreground"
                            : event.status === "rejected"
                              ? "bg-destructive/30 text-destructive border border-destructive/50"
                              : "bg-yellow-400/50 text-yellow-800 border border-yellow-500 dark:text-yellow-200"
                        }`}
                        title={`${event.title} - ${event.status}`}
                      >
                        {event.title}
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

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading requests...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
