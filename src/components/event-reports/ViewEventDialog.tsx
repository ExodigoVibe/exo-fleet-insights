import { Info, Car, FileText, Users, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EventReport } from "@/hooks/queries/useEventReportsQuery";

interface ViewEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: EventReport | null;
}

export function ViewEventDialog({ open, onOpenChange, report }: ViewEventDialogProps) {
  if (!report) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "slight":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "extensive":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "reviewed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            Event Report Details
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-6">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 mb-2">
              This is a read-only view of the event report. No changes can be made.
            </p>
            <div className="flex gap-2">
              <Badge variant="outline" className={getSeverityColor(report.severity)}>
                {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
              </Badge>
              <Badge variant="outline" className={getStatusColor(report.status)}>
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Vehicle & Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <Car className="h-5 w-5 text-primary" />
              Vehicle & Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Vehicle License Plate</label>
                <p className="text-base font-medium mt-1">{report.vehicle_license_plate}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Employee Name</label>
                <p className="text-base font-medium mt-1">{report.employee_name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Date and Time of Event</label>
                <p className="text-base font-medium mt-1">
                  {format(new Date(report.event_date), "MMM dd, yyyy 'at' HH:mm")}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="text-base font-medium mt-1">{report.location}</p>
              </div>
            </div>
          </div>

          {/* Event Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <FileText className="h-5 w-5 text-primary" />
              Event Details
            </h3>

            <div className="bg-muted/30 p-4 rounded-lg space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-base mt-2 whitespace-pre-wrap">
                  {report.description || "No description provided"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Severity of Damages</label>
                <div className="mt-2">
                  <Badge variant="outline" className={getSeverityColor(report.severity)}>
                    {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)} Damage
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Photos Section */}
          {report.photo_urls && report.photo_urls.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Photos of Damage</h3>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {report.photo_urls.length} photo(s) attached
                </p>
                {/* Future enhancement: Display actual photos here */}
              </div>
            </div>
          )}

          {/* Third Party Involvement Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <Users className="h-5 w-5 text-primary" />
              Third Party Involvement
            </h3>

            {report.third_party_involved ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                {report.third_party_name && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Car Owner</label>
                    <p className="text-base font-medium mt-1">{report.third_party_name}</p>
                  </div>
                )}

                {report.third_party_license_plate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">License Plate</label>
                    <p className="text-base font-medium mt-1">{report.third_party_license_plate}</p>
                  </div>
                )}

                {report.third_party_phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                    <p className="text-base font-medium mt-1">{report.third_party_phone}</p>
                  </div>
                )}

                {report.third_party_insurance && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Insurance Policy</label>
                    <p className="text-base font-medium mt-1">{report.third_party_insurance}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">No third party involved in this incident</p>
              </div>
            )}
          </div>

          {/* Report Metadata */}
          <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
            <p>Report ID: {report.id}</p>
            <p>Created: {format(new Date(report.created_at), "MMM dd, yyyy 'at' HH:mm")}</p>
            <p>Last Updated: {format(new Date(report.updated_at), "MMM dd, yyyy 'at' HH:mm")}</p>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="hover:bg-gray-100 hover:text-foreground"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
