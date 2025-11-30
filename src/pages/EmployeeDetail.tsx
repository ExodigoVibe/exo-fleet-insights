import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User, Briefcase, Shield, Mail, Phone, Building2, Key, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDriversQuery } from "@/hooks/queries/useDriversQuery";
import { useVehicleRequestsQuery } from "@/hooks/queries/useVehicleRequestsQuery";
import { format } from "date-fns";

export default function EmployeeDetail() {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const { data: drivers = [], isLoading: driversLoading } = useDriversQuery();
  const { data: requests = [], isLoading: requestsLoading } = useVehicleRequestsQuery();

  const driver = drivers.find((d) => d.driver_id === Number(driverId));

  // Find vehicle requests for this employee by matching email or name
  const employeeRequests = requests.filter((req) => {
    if (!driver) return false;
    const driverFullName = `${driver.first_name} ${driver.last_name}`.toLowerCase();
    const requestFullName = req.full_name.toLowerCase();
    const emailMatch = driver.email && req.email && driver.email.toLowerCase() === req.email.toLowerCase();
    const nameMatch = driverFullName === requestFullName;
    return emailMatch || nameMatch;
  });

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

  if (driversLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading employee details...</div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="space-y-6 p-8">
        <Button variant="outline" onClick={() => navigate("/employees")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Button>
        <div className="text-center text-muted-foreground">Employee not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/employees")}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          Profile for {driver.first_name}.{driver.last_name}
        </h1>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee ID */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="text-base font-medium">{driver.driver_id}</p>
              </div>
            </div>

            {/* Driver Code */}
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Driver Code</p>
                <p className="text-base font-medium">{driver.driver_code || "-"}</p>
              </div>
            </div>

            {/* Name */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="text-base font-medium">
                  {driver.first_name} {driver.last_name}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {driver.is_blocked ? (
                  <Badge variant="destructive" className="mt-1">Blocked</Badge>
                ) : (
                  <Badge className="bg-green-600 mt-1">Active</Badge>
                )}
              </div>
            </div>

            {/* Email Address */}
            {driver.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <a
                    href={`mailto:${driver.email}`}
                    className="text-base font-medium text-blue-600 hover:underline"
                  >
                    {driver.email}
                  </a>
                </div>
              </div>
            )}

            {/* Phone Number */}
            {(driver.phone || driver.cellular) && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <a
                    href={`tel:${driver.phone || driver.cellular}`}
                    className="text-base font-medium text-blue-600 hover:underline"
                  >
                    {driver.phone || driver.cellular}
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Key className="h-5 w-5" />
            Vehicle Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading vehicle access history...
            </div>
          ) : employeeRequests.length === 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">No Active or Past Requests</p>
                  <p className="text-sm text-red-700">
                    This employee has no vehicle access history.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {employeeRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/requests/${request.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {request.usage_type === "single_use" ? "Single Use" : "Permanent Driver"}
                        </Badge>
                        <Badge variant="outline" className={getStatusBadgeColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.start_date), "MMM dd, yyyy")}
                        {request.end_date && ` - ${format(new Date(request.end_date), "MMM dd, yyyy")}`}
                      </p>
                      {request.purpose && (
                        <p className="text-sm mt-1">{request.purpose}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver's License */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            Driver's License
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No driver license information on file.</p>
        </CardContent>
      </Card>

      {/* Signed Forms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            Signed Forms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No signed forms found for this employee.</p>
        </CardContent>
      </Card>
    </div>
  );
}
