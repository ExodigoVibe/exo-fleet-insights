import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";
import { NewTemplateSheet } from "@/components/form-templates/NewTemplateSheet";
import { useFormTemplatesQuery, useDeleteFormTemplate } from "@/hooks/queries/useFormTemplatesQuery";

const formatUsageType = (type: string) => {
  switch (type) {
    case "single_use":
      return "Single Use";
    case "permanent":
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

export default function FormTemplates() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: templates, isLoading } = useFormTemplatesQuery();
  const deleteMutation = useDeleteFormTemplate();

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Form Template Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Create and edit form templates for vehicle requests
            </p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setSheetOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Form Templates Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Form Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      Loading templates...
                    </TableCell>
                  </TableRow>
                ) : templates && templates.length > 0 ? (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        {template.form_title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-background">
                          {formatFormType(template.form_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {formatUsageType(template.usage_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={template.is_active 
                            ? "bg-green-50 text-green-700 border-green-200" 
                            : "bg-gray-50 text-gray-700 border-gray-200"
                          }
                        >
                          {template.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      No form templates found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <NewTemplateSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
