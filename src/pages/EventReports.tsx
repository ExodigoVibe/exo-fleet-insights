import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, AlertTriangle, ExternalLink, Trash2 } from "lucide-react";
import { ReportEventDialog } from "@/components/event-reports/ReportEventDialog";
import { ViewEventDialog } from "@/components/event-reports/ViewEventDialog";
import { useEventReportsQuery, useDeleteEventReport, EventReport } from "@/hooks/queries/useEventReportsQuery";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as XLSX from "xlsx";

export default function EventReports() {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<EventReport | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<EventReport | null>(null);
  const { data: reports = [], isLoading } = useEventReportsQuery();
  const deleteReportMutation = useDeleteEventReport();
  const [searchParams, setSearchParams] = useSearchParams();

  // Check if there's a reportId in the URL and open the dialog
  useEffect(() => {
    const reportId = searchParams.get('reportId');
    if (reportId && reports.length > 0) {
      const report = reports.find(r => r.id === reportId);
      if (report) {
        setSelectedReport(report);
        setViewDialogOpen(true);
        // Remove the query param after opening the dialog
        setSearchParams({});
      }
    }
  }, [searchParams, reports, setSearchParams]);

  const handleViewReport = (report: EventReport) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (report: EventReport, e: React.MouseEvent) => {
    e.stopPropagation();
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (reportToDelete) {
      deleteReportMutation.mutate(reportToDelete.id);
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      reports.map((report) => ({
        Date: new Date(report.event_date).toLocaleDateString(),
        Employee: report.employee_name,
        Location: report.location,
        Severity: report.severity,
        Status: report.status,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Event Reports");
    XLSX.writeFile(workbook, "event_reports.xlsx");
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "slight":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "extensive":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "reviewed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Event Reports</h1>
            <p className="text-muted-foreground mt-1">
              Report and manage vehicle incidents and accidents
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleExportToExcel}
              variant="outline"
              className="gap-2 hover:bg-gray-100 hover:text-foreground"
            >
              Excel <Download className="h-4 w-4" />
            </Button>
            <Button 
              variant="destructive" 
              className="gap-2"
              onClick={() => setReportDialogOpen(true)}
            >
              <AlertTriangle className="h-4 w-4" /> Report Event
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Event Reports ({reports.length})
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading event reports...
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No event reports found
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id} onClick={() => handleViewReport(report)} className="cursor-pointer hover:bg-muted">
                    <TableCell>
                      {new Date(report.event_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{report.employee_name}</TableCell>
                    <TableCell>{report.location}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getSeverityBadgeColor(report.severity)}
                      >
                        {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusBadgeColor(report.status)}
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-transparent gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewReport(report);
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-transparent gap-1"
                          onClick={(e) => handleDeleteClick(report, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <ReportEventDialog 
        open={reportDialogOpen} 
        onOpenChange={setReportDialogOpen} 
      />

      <ViewEventDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        report={selectedReport}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
