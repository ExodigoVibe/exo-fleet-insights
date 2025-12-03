import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateFormTemplate, useUpdateFormTemplate, FormTemplate } from "@/hooks/queries/useFormTemplatesQuery";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X, Save, Plus, GripVertical, Trash2, FileText, Upload } from "lucide-react";

const formSchema = z.object({
  formTitle: z.string().min(1, "Form title is required").max(200),
  description: z.string().max(1000).optional(),
  usageType: z.enum(["single_use", "permanent", "both"]),
  formType: z.enum(["custom", "vehicle_procedure", "driver_file", "traffic_history"]),
  pdfTemplate: z.any().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface FormField {
  id: number;
  type: "text" | "textarea" | "date" | "dropdown" | "checkbox" | "signature";
  label: string;
  placeholder: string;
  required: boolean;
}

interface NewTemplateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: FormTemplate | null;
}

export function NewTemplateSheet({ open, onOpenChange, template }: NewTemplateSheetProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const createMutation = useCreateFormTemplate();
  const updateMutation = useUpdateFormTemplate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formTitle: "",
      description: "",
      usageType: "single_use",
      formType: "custom",
      isActive: true,
    },
  });

  // Populate form when template is provided for editing
  useEffect(() => {
    if (template && open) {
      form.reset({
        formTitle: template.form_title,
        description: template.description || "",
        usageType: template.usage_type as "single_use" | "permanent" | "both",
        formType: template.form_type as "custom" | "vehicle_procedure" | "driver_file" | "traffic_history",
        isActive: template.is_active ?? true,
      });
      
      // Set form fields if they exist
      if (template.form_fields && Array.isArray(template.form_fields)) {
        setFields(template.form_fields as FormField[]);
      } else {
        setFields([]);
      }
      
      // Set existing PDF URL
      setExistingFileUrl(template.pdf_template_url);
      setUploadedFiles([]);
    } else if (!template && open) {
      // Reset form for new template
      form.reset({
        formTitle: "",
        description: "",
        usageType: "single_use",
        formType: "custom",
        isActive: true,
      });
      setFields([]);
      setUploadedFiles([]);
      setExistingFileUrl(null);
    }
  }, [template, open, form]);

  const uploadFiles = async (): Promise<string | null> => {
    if (uploadedFiles.length === 0) return existingFileUrl;
    
    setIsUploading(true);
    try {
      const file = uploadedFiles[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `templates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('form-template-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('form-template-files')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      return existingFileUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    const pdfUrl = await uploadFiles();
    
    if (template) {
      // Update existing template
      await updateMutation.mutateAsync({
        id: template.id,
        data: {
          form_title: data.formTitle,
          description: data.description || null,
          usage_type: data.usageType,
          form_type: data.formType,
          is_active: data.isActive,
          form_fields: fields,
          pdf_template_url: pdfUrl,
        },
      });
    } else {
      // Create new template
      await createMutation.mutateAsync({
        form_title: data.formTitle,
        description: data.description || null,
        usage_type: data.usageType,
        form_type: data.formType,
        is_active: data.isActive,
        form_fields: fields,
        pdf_template_url: pdfUrl,
      });
    }
    
    form.reset();
    setFields([]);
    setUploadedFiles([]);
    setExistingFileUrl(null);
    onOpenChange(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFiles(Array.from(files));
      setExistingFileUrl(null); // Clear existing when new file selected
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingFile = () => {
    setExistingFileUrl(null);
  };

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        id: Date.now(),
        type: "text",
        label: "New Field",
        placeholder: "",
        required: false,
      },
    ]);
  };

  const handleDeleteField = (id: number) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const handleUpdateField = (id: number, updates: Partial<FormField>) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[700px] overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-6 mr-4">
          <SheetTitle className="text-2xl font-bold">
            {template ? "Edit Template" : "New Template"}
          </SheetTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-3"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={form.handleSubmit(onSubmit)}
              className="h-9 px-4"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Form Title */}
            <FormField
              control={form.control}
              name="formTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Form Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Form name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the form"
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Usage Type and Form Type */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="usageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select usage type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single_use">Single Use</SelectItem>
                        <SelectItem value="permanent">Permanent Driver</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="formType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select form type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="vehicle_procedure">Vehicle Procedure</SelectItem>
                        <SelectItem value="driver_file">Driver File</SelectItem>
                        <SelectItem value="traffic_history">Traffic History</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* PDF Template */}
            <div className="space-y-3">
              <FormLabel>PDF Template (Optional)</FormLabel>
              
              {/* Existing File Display */}
              {existingFileUrl && (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                  <FileText className="h-5 w-5 text-primary" />
                  <a 
                    href={existingFileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-primary hover:underline truncate"
                  >
                    {existingFileUrl.split('/').pop()}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveExistingFile}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Newly Selected Files Display */}
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="flex-1 text-sm truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(index)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {/* File Upload Input */}
              {!existingFileUrl && uploadedFiles.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                </div>
              )}
              
              {/* Replace File Button */}
              {(existingFileUrl || uploadedFiles.length > 0) && (
                <div>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a new file to replace the current one
                  </p>
                </div>
              )}
            </div>

            {/* Active Form Toggle */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Form</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Form Fields Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Form Fields</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddField}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No fields added yet. Click "Add Field" to start building your form.
                </p>
              )}

              {fields.length > 0 && (
                <div className="space-y-4">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="p-6 border rounded-lg bg-background space-y-4"
                    >
                      {/* Field Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                          <span className="font-medium">{field.type}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteField(field.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Field Configuration */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Field Label */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Field Label
                          </label>
                          <Input
                            value={field.label}
                            onChange={(e) =>
                              handleUpdateField(field.id, {
                                label: e.target.value,
                              })
                            }
                            placeholder="New Field"
                          />
                        </div>

                        {/* Field Type */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Field Type
                          </label>
                          <Select
                            value={field.type}
                            onValueChange={(value) =>
                              handleUpdateField(field.id, {
                                type: value as FormField["type"],
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="textarea">Text Area</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="dropdown">Dropdown</SelectItem>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                              <SelectItem value="signature">Signature</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Placeholder Text */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Placeholder Text
                        </label>
                        <Input
                          value={field.placeholder}
                          onChange={(e) =>
                            handleUpdateField(field.id, {
                              placeholder: e.target.value,
                            })
                          }
                          placeholder="Help text for field"
                        />
                      </div>

                      {/* Required Field Toggle */}
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={field.required}
                          onCheckedChange={(checked) =>
                            handleUpdateField(field.id, { required: checked })
                          }
                        />
                        <label className="text-sm font-medium">
                          Required Field
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
