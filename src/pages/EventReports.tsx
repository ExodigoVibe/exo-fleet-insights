import { useState } from "react";
import { Download, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as XLSX from "xlsx";

interface EventReport {
  id: string;
  date: string;
  employee: string;
  location: string;
  severity: "slight" | "moderate" | "extensive";
  status: "pending" | "reviewed" | "closed";
}

export default function EventReports() {
  const mockReports: EventReport[] = [];

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      mockReports.map((report) => ({
        Date: report.date,
        Employee: report.employee,
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
      case "moderate":
        return "bg-orange-100 text-orange-800 border-orange-200";
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
            <Button variant="destructive" className="gap-2">
              <AlertTriangle className="h-4 w-4" /> Report Event
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Event Reports ({mockReports.length})
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
              {mockReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No event reports found
                  </TableCell>
                </TableRow>
              ) : (
                mockReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      {new Date(report.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{report.employee}</TableCell>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-transparent gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
