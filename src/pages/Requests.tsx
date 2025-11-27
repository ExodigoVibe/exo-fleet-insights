import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Plus, User, Calendar } from "lucide-react";
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

type RequestStatus = "all" | "pending_manager" | "approved" | "rejected";

interface VehicleRequest {
  id: string;
  employee_name: string;
  employee_department: string;
  type: string;
  date: string;
  status: string;
  priority: string;
}

export default function Requests() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<RequestStatus>("all");

  const requests: VehicleRequest[] = [];

  const allRequestsCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "Pending Manager").length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;
  const rejectedCount = requests.filter((r) => r.status === "Rejected").length;

  const filteredRequests = requests.filter((request) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending_manager") return request.status === "Pending Manager";
    if (statusFilter === "approved") return request.status === "Approved";
    if (statusFilter === "rejected") return request.status === "Rejected";
    return true;
  });

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredRequests.map((req) => ({
        Employee: req.employee_name,
        Department: req.employee_department,
        Type: req.type,
        Date: req.date,
        Status: req.status,
        Priority: req.priority,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Requests");
    XLSX.writeFile(workbook, "vehicle_requests.xlsx");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Pending Manager":
        return "secondary";
      case "Approved":
        return "default";
      case "Rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTableTitle = () => {
    if (statusFilter === "pending_manager") return `Pending Manager (${pendingCount})`;
    if (statusFilter === "approved") return `Approved (${approvedCount})`;
    if (statusFilter === "rejected") return `Rejected (${rejectedCount})`;
    return `All Requests (${allRequestsCount})`;
  };

  return (
    <div className="space-y-8 p-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Vehicle Requests</h1>
            <p className="text-muted-foreground mt-1">Manage all vehicle requests</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleExportToExcel}
              variant="outline"
              className="gap-2"
            >
              Excel <Download className="h-4 w-4" />
            </Button>
            <Button className="gap-2" onClick={() => navigate("/requests/new")}>
              <Plus className="h-4 w-4" /> New Request
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={`p-6 cursor-pointer transition-all hover:shadow-md ${
            statusFilter === "all" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setStatusFilter("all")}
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">All Requests</p>
            <p className="text-3xl font-bold">{allRequestsCount}</p>
          </div>
        </Card>

        <Card
          className={`p-6 cursor-pointer transition-all hover:shadow-md ${
            statusFilter === "pending_manager" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setStatusFilter("pending_manager")}
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Pending Manager</p>
            <p className="text-3xl font-bold">{pendingCount}</p>
          </div>
        </Card>

        <Card
          className={`p-6 cursor-pointer transition-all hover:shadow-md ${
            statusFilter === "approved" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setStatusFilter("approved")}
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Approved</p>
            <p className="text-3xl font-bold">{approvedCount}</p>
          </div>
        </Card>

        <Card
          className={`p-6 cursor-pointer transition-all hover:shadow-md ${
            statusFilter === "rejected" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setStatusFilter("rejected")}
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Rejected</p>
            <p className="text-3xl font-bold">{rejectedCount}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-primary">✓</span> {getTableTitle()}
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{request.employee_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {request.employee_department}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {request.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(request.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(request.status)} className="bg-amber-50 text-amber-700 border-amber-200">
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{request.priority}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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
    </div>
  );
}
