import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Download, Plus, User, Calendar, Check, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVehicleRequestsQuery, useDeleteVehicleRequest, useApproveVehicleRequest, useUndoApproveVehicleRequest, useRejectVehicleRequest, useUndoRejectVehicleRequest } from "@/hooks/queries/useVehicleRequestsQuery";
import { useAuth } from "@/hooks/useAuth";
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

export default function Requests() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<RequestStatus>("all");
  const { data: requests = [], isLoading } = useVehicleRequestsQuery();
  const deleteRequest = useDeleteVehicleRequest();
  const approveRequest = useApproveVehicleRequest();
  const undoApproveRequest = useUndoApproveVehicleRequest();
  const rejectRequest = useRejectVehicleRequest();
  const undoRejectRequest = useUndoRejectVehicleRequest();
  const { hasAdminAccess, user } = useAuth();

  // Filter requests by user email for non-admin users
  const userRequests = useMemo(() => {
    if (hasAdminAccess || !user?.email) return requests;
    return requests.filter((r) => r.email === user.email);
  }, [requests, hasAdminAccess, user?.email]);

  // Read filter from URL on mount
  useEffect(() => {
    const filterParam = searchParams.get("filter") as RequestStatus;
    if (filterParam && ["all", "pending_manager", "approved", "rejected"].includes(filterParam)) {
      setStatusFilter(filterParam);
    }
  }, [searchParams]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this request?")) {
      await deleteRequest.mutateAsync(id);
    }
  };

  const handleApprove = async (id: string) => {
    await approveRequest.mutateAsync(id);
  };

  const handleUndoApprove = async (id: string) => {
    await undoApproveRequest.mutateAsync(id);
  };

  const handleReject = async (id: string) => {
    await rejectRequest.mutateAsync(id);
  };

  const handleUndoReject = async (id: string) => {
    await undoRejectRequest.mutateAsync(id);
  };

  const allRequestsCount = userRequests.length;
  const pendingCount = userRequests.filter((r) => r.status === "pending_manager").length;
  const approvedCount = userRequests.filter((r) => r.status === "approved").length;
  const rejectedCount = userRequests.filter((r) => r.status === "rejected").length;

  const filteredRequests = userRequests.filter((request) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending_manager") return request.status === "pending_manager";
    if (statusFilter === "approved") return request.status === "approved";
    if (statusFilter === "rejected") return request.status === "rejected";
    return true;
  });

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredRequests.map((req) => ({
        Employee: req.full_name,
        Department: req.department,
        Type: req.usage_type === "single_use" ? "Single Use" : "Permanent Driver",
        Date: new Date(req.start_date).toLocaleDateString(),
        Status: req.status,
        Priority: req.priority,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Requests");
    XLSX.writeFile(workbook, "vehicle_requests.xlsx");
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending_manager":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "approved":
        return "bg-green-50 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_manager":
        return "Pending Manager";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return status;
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading requests...
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow 
                    key={request.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/requests/${request.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{request.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {request.department}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {request.usage_type === "single_use" ? "Single Use" : "Permanent Driver"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(request.start_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeColor(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {hasAdminAccess && request.status === "pending_manager" && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-600 hover:text-green-700 hover:bg-transparent gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(request.id);
                              }}
                            >
                              <Check className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-transparent gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(request.id);
                              }}
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                        {hasAdminAccess && request.status === "approved" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-orange-600 hover:text-orange-700 hover:bg-transparent gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUndoApprove(request.id);
                            }}
                          >
                            <Undo2 className="h-4 w-4" />
                            Undo
                          </Button>
                        )}
                        {hasAdminAccess && request.status === "rejected" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-orange-600 hover:text-orange-700 hover:bg-transparent gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUndoReject(request.id);
                            }}
                          >
                            <Undo2 className="h-4 w-4" />
                            Undo
                          </Button>
                        )}
                        <Button
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-700 hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/requests/edit/${request.id}`);
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(request.id);
                          }}
                        >
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
