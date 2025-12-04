import { FileText, ExternalLink, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FormTemplate } from '@/hooks/queries/useFormTemplatesQuery';

interface ViewTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FormTemplate | null;
}

const formatUsageType = (type: string) => {
  switch (type) {
    case "single_use":
      return "Single Use";
    case "permanent_driver":
      return "Permanent Driver";
    case "both":
      return "Both";
    default:
      return type;
  }
};

const formatFormType = (type: string) => {
  switch (type) {
    case "custom":
      return "Custom Form";
    case "vehicle_procedure":
      return "Vehicle Procedure";
    case "driver_file":
      return "Driver File";
    case "traffic_history":
      return "Traffic History";
    default:
      return type;
  }
};

export function ViewTemplateDialog({ open, onOpenChange, template }: ViewTemplateDialogProps) {
  if (!template) return null;

  const formFields = template.form_fields || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Template Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className={template.is_active 
                ? "bg-green-100 text-green-700 border-green-200" 
                : "bg-gray-100 text-gray-700 border-gray-200"
              }
            >
              {template.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
              {formatFormType(template.form_type)}
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
              {formatUsageType(template.usage_type)}
            </Badge>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{template.form_title}</h3>
              {template.description && (
                <p className="text-muted-foreground mt-1">{template.description}</p>
              )}
            </div>
          </div>

          {/* PDF Template */}
          {template.pdf_template_url && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                PDF Template
              </h4>
              <div className="bg-muted/30 p-4 rounded-lg">
                <a
                  href={template.pdf_template_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View PDF Document
                </a>
              </div>
            </div>
          )}

          {/* Form Fields */}
          {formFields.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Form Fields ({formFields.length})</h4>
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                {formFields.map((field: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs capitalize">
                        {field.type}
                      </Badge>
                      <span className="font-medium">{field.label}</span>
                      {field.required && (
                        <span className="text-red-500 text-xs">Required</span>
                      )}
                    </div>
                    {field.placeholder && (
                      <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {field.placeholder}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created: {template.created_at ? format(new Date(template.created_at), "MMM dd, yyyy 'at' HH:mm") : 'N/A'}
            </p>
            <p className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Updated: {template.updated_at ? format(new Date(template.updated_at), "MMM dd, yyyy 'at' HH:mm") : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
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