import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { X, Save, Plus } from "lucide-react";

const formSchema = z.object({
  formTitle: z.string().min(1, "Form title is required").max(200),
  description: z.string().max(1000).optional(),
  usageType: z.enum(["single_use", "permanent", "both"]),
  formType: z.enum(["custom", "vehicle_procedure", "driver_file", "traffic_history"]),
  pdfTemplate: z.any().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface NewTemplateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTemplateSheet({ open, onOpenChange }: NewTemplateSheetProps) {
  const [fields, setFields] = useState<any[]>([]);

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

  const onSubmit = async (data: FormValues) => {
    console.log("Form data:", data);
    console.log("Form fields:", fields);
    // TODO: Save to database
    form.reset();
    setFields([]);
    onOpenChange(false);
  };

  const handleAddField = () => {
    setFields([...fields, { id: Date.now(), type: "text", label: "" }]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[700px] overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <SheetTitle className="text-2xl font-bold">New Template</SheetTitle>
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
            <FormField
              control={form.control}
              name="pdfTemplate"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>PDF Template (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => onChange(e.target.files?.[0])}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                <div className="space-y-3">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="p-4 border rounded-lg bg-muted/50"
                    >
                      <p className="text-sm">Field {field.id}</p>
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
