import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Download, ExternalLink, PenTool, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVehicleRequestsQuery } from '@/hooks/queries/useVehicleRequestsQuery';
import { useFormTemplatesQuery } from '@/hooks/queries/useFormTemplatesQuery';
import { format } from 'date-fns';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: requests = [], isLoading } = useVehicleRequestsQuery();
  const { data: formTemplates = [] } = useFormTemplatesQuery();

  const request = requests.find((r) => r.id === id);
  const signedTemplate = request?.signed_template_id 
    ? formTemplates.find((t) => t.id === request.signed_template_id)
    : null;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending_manager':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_manager':
        return 'Pending Manager';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
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
        <Button variant="outline" onClick={() => navigate('/requests')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Requests
        </Button>
        <div className="text-center text-muted-foreground">Request not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <Button variant="outline" onClick={() => navigate('/requests')} className="gap-2">
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
              <h3 className="text-sm font-medium text-muted-foreground">Employee Name</h3>
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
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 text-sm py-1 px-3"
              >
                {request.usage_type === 'single_use' ? 'Single Use' : 'Permanent Driver'}
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <Badge
                variant="outline"
                className={`${getStatusBadgeColor(request.status)} text-sm py-1 px-3`}
              >
                {getStatusLabel(request.status)}
              </Badge>
            </div>
          </div>

          {/* Start Date and End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
              <p className="text-lg font-semibold">
                {format(new Date(request.start_date), 'MMMM do, yyyy')}
              </p>
            </div>
            {request.end_date && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">End Date</h3>
                <p className="text-lg font-semibold">
                  {format(new Date(request.end_date), 'MMMM do, yyyy')}
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

          {/* Signed Document Section */}
          {(request.signature_url || signedTemplate) && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <PenTool className="h-5 w-5 text-primary" />
                Signed Document
              </h3>

              <div className="border rounded-lg p-4 bg-green-50/50">
                {signedTemplate && (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {signedTemplate.form_title}
                        </h4>
                        {signedTemplate.description && (
                          <p className="text-sm text-muted-foreground">{signedTemplate.description}</p>
                        )}
                      </div>
                      {signedTemplate.pdf_template_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(signedTemplate.pdf_template_url!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Document
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {request.signature_url && (
                  <div className={signedTemplate ? "mt-4 pt-4 border-t" : ""}>
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">Signature</h5>
                    <div className="bg-white border rounded-lg p-2 inline-block">
                      <img
                        src={request.signature_url}
                        alt="User signature"
                        className="max-h-24 max-w-[300px]"
                      />
                    </div>
                    {request.signed_at && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Signed on: {format(new Date(request.signed_at), "MMMM do, yyyy 'at' HH:mm")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents & Forms */}
          {(request.license_file_url || (request.file_urls && request.file_urls.length > 0)) && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Documents & Files</h3>

              {request.license_file_url && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold">Driver's License</h4>
                      <p className="text-sm text-muted-foreground">
                        Required identification document
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => window.open(request.license_file_url, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = request.license_file_url!;
                          link.download = 'drivers_license';
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {request.file_urls && request.file_urls.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Uploaded Files</h4>
                  <div className="space-y-2">
                    {request.file_urls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm truncate max-w-[300px]">
                          File {index + 1}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => window.open(url, '_blank')}
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => window.open(url, '_blank')}
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}