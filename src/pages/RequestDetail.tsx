import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVehicleRequestsQuery } from "@/hooks/queries/useVehicleRequestsQuery";
import { format } from "date-fns";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: requests = [], isLoading } = useVehicleRequestsQuery();

  const request = requests.find((r) => r.id === id);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading request details...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-6 p-8">
        <Button variant="outline" onClick={() => navigate("/requests")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Requests
        </Button>
        <div className="text-center text-muted-foreground">Request not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <Button variant="outline" onClick={() => navigate("/requests")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Requests
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Request Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Employee and Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Employee</h3>
              <p className="text-lg font-semibold">{request.full_name}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Department</h3>
              <p className="text-lg font-semibold">{request.department}</p>
            </div>
          </div>

          {/* Usage Type and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Usage Type</h3>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-sm py-1 px-3">
                {request.usage_type === "single_use" ? "Single Use" : "Permanent Driver"}
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <Badge variant="outline" className={`${getStatusBadgeColor(request.status)} text-sm py-1 px-3`}>
                {getStatusLabel(request.status)}
              </Badge>
            </div>
          </div>

          {/* Start Date and End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
              <p className="text-lg font-semibold">
                {format(new Date(request.start_date), "MMMM do, yyyy")}
              </p>
            </div>
            {request.end_date && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">End Date</h3>
                <p className="text-lg font-semibold">
                  {format(new Date(request.end_date), "MMMM do, yyyy")}
                </p>
              </div>
            )}
          </div>

          {/* Additional Details */}
          {request.job_title && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Job Title</h3>
              <p className="text-base">{request.job_title}</p>
            </div>
          )}

          {request.purpose && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Purpose</h3>
              <p className="text-base">{request.purpose}</p>
            </div>
          )}

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {request.email && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                <p className="text-base">{request.email}</p>
              </div>
            )}
            {request.phone_number && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Phone Number</h3>
                <p className="text-base">{request.phone_number}</p>
              </div>
            )}
          </div>

          {/* Manager Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {request.department_manager && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Department Manager</h3>
                <p className="text-base">{request.department_manager}</p>
              </div>
            )}
            {request.manager_email && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Manager Email</h3>
                <p className="text-base">{request.manager_email}</p>
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Priority</h3>
            <p className="text-base font-medium capitalize">{request.priority}</p>
          </div>

          {/* Documents & Forms */}
          {request.license_file_url && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Documents & Forms</h3>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold">Driver's License</h4>
                    <p className="text-sm text-muted-foreground">Required identification document</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(request.license_file_url, "_blank")}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = request.license_file_url!;
                        link.download = "drivers_license";
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(request.license_file_url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
