import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useFormTemplatesQuery, useDeleteFormTemplate, FormTemplate } from "@/hooks/queries/useFormTemplatesQuery";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const { data: templates, isLoading } = useFormTemplatesQuery();
  const deleteMutation = useDeleteFormTemplate();

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleEdit = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setSheetOpen(true);
  };

  const handleCloseSheet = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Form Templates</h1>
          </div>
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Form Templates Table */}
        <div className="bg-card rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="text-muted-foreground font-medium">Form Name</TableHead>
                <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                <TableHead className="text-muted-foreground font-medium">Usage</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Actions</TableHead>
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
                      <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100">
                        {formatFormType(template.form_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
                        {formatUsageType(template.usage_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={template.is_active 
                          ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" 
                          : "bg-gray-100 text-gray-700 border-gray-200"
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
                          onClick={() => handleEdit(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Template</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{template.form_title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(template.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    No form templates found. Create your first template to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <NewTemplateSheet 
        open={sheetOpen} 
        onOpenChange={handleCloseSheet}
        template={selectedTemplate}
      />
    </div>
  );
}
